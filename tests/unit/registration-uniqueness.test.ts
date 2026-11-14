import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

type Row = Record<string, any>;

const mockUsers: Row[] = [];

const mockPrisma: any = {
  user: {
    findUnique: async ({ where }: Row) => {
      if (where.id) return mockUsers.find((u) => u.id === where.id) ?? null;
      if (where.email) return mockUsers.find((u) => u.email === where.email.toLowerCase()) ?? null;
      return null;
    },
    findFirst: async ({ where }: Row) => {
      return (
        mockUsers.find((u) => {
          if (where.id?.not && u.id === where.id.not) return false;
          if (where.OR) {
            return where.OR.some((cond: Row) => {
              if (cond.phone && u.phone === cond.phone) return true;
              if (cond.phone?.contains && u.phone && u.phone.includes(cond.phone.contains)) return true;
              return false;
            });
          }
          return false;
        }) ?? null
      );
    },
    create: async ({ data }: Row) => {
      const newUser = {
        id: `cust_${mockUsers.length + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionVersion: 0,
        ...data,
      };
      mockUsers.push(newUser);
      return newUser;
    },
    update: async ({ where, data }: Row) => {
      const u = mockUsers.find((x) => x.id === where.id);
      if (!u) throw new Error("User not found");
      Object.assign(u, data);
      return u;
    },
  },
  authToken: {
    create: async ({ data }: Row) => ({ id: "tok_1", ...data }),
    updateMany: async () => ({ count: 1 }),
  },
  rateLimitBucket: {
    findUnique: async () => null,
    upsert: async () => ({ count: 1, resetAt: new Date(Date.now() + 60000) }),
  },
  auditLog: {
    create: async () => ({ id: "audit_1" }),
  },
};

(globalThis as any).prisma = mockPrisma;
process.env.AUTH_SECRET = "test-secret-for-customer-auth-0123456789abcdef";
process.env.DATABASE_URL = "postgresql://test-db";

test("registration - createCustomerUser creates new customer and rejects duplicate email or phone", async () => {
  mockUsers.length = 0;
  const { createCustomerUser } = await import("../../src/lib/customer-auth");

  // Create initial user
  const user1 = await createCustomerUser({
    name: "Aarav Sharma",
    email: "aarav@example.com",
    phone: "9876543210",
    password: "StrongPassword123!",
  });

  assert.equal(user1.email, "aarav@example.com");
  assert.equal(user1.phone, "9876543210");
  assert.equal(user1.name, "Aarav Sharma");

  // Attempt duplicate email
  await assert.rejects(
    () =>
      createCustomerUser({
        name: "Aarav Clone",
        email: "AARAV@example.com", // case-insensitive duplicate
        phone: "9811122233",
        password: "StrongPassword123!",
      }),
    /ACCOUNT_EXISTS/
  );

  // Attempt duplicate phone number with different email
  await assert.rejects(
    () =>
      createCustomerUser({
        name: "Different User",
        email: "different@example.com",
        phone: "9876543210", // duplicate phone
        password: "StrongPassword123!",
      }),
    /PHONE_EXISTS/
  );

  // Attempt duplicate phone number formatted with +91
  await assert.rejects(
    () =>
      createCustomerUser({
        name: "Different User 2",
        email: "different2@example.com",
        phone: "+919876543210", // formatted duplicate phone
        password: "StrongPassword123!",
      }),
    /PHONE_EXISTS/
  );
});

test("registration - POST /api/auth/customer/register creates account directly without confirmation email", async () => {
  mockUsers.length = 0;
  const { POST } = await import("../../src/app/api/auth/customer/register/route");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-proto": "https" },
    body: JSON.stringify({
      name: "Pooja Mehta",
      email: "pooja@example.com",
      phone: "9823456789",
      password: "LuxuryPassword2026!",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.user.email, "pooja@example.com");
  assert.equal(data.user.phone, "9823456789");
  assert.equal(data.pendingConfirmation, undefined, "Must NOT have pendingConfirmation flag");

  // Check that session cookie was set
  const setCookie = res.headers.get("set-cookie") || "";
  const cookie = res.cookies.get("__Host-ts_customer_session") || res.cookies.get("ts_customer_session");
  assert.ok(cookie?.value || setCookie.includes("ts_customer_session"), "Session cookie should be set directly");
});

test("registration - POST /api/auth/customer/register rejects duplicate email with HTTP 409", async () => {
  const { POST } = await import("../../src/app/api/auth/customer/register/route");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Pooja Duplicate",
      email: "pooja@example.com",
      phone: "9123456780",
      password: "LuxuryPassword2026!",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /already exists/i);
});

test("registration - POST /api/auth/customer/register rejects duplicate mobile number with HTTP 409", async () => {
  const { POST } = await import("../../src/app/api/auth/customer/register/route");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Another Person",
      email: "anotherperson@example.com",
      phone: "+91 98234 56789", // Same phone as Pooja
      password: "LuxuryPassword2026!",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /mobile number already exists/i);
});

test("registration - POST /api/auth/customer/register rejects invalid phone format with HTTP 400", async () => {
  const { POST } = await import("../../src/app/api/auth/customer/register/route");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Invalid Phone User",
      email: "badphone@example.com",
      phone: "12345", // Not a valid 10-digit mobile number
      password: "LuxuryPassword2026!",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /valid 10-digit mobile number/i);
});

test("account profile - PATCH /api/account rejects duplicate mobile number with HTTP 409", async () => {
  const { PATCH } = await import("../../src/app/api/account/route");
  const { signCustomerToken } = await import("../../src/lib/customer-auth");

  // mockUsers already has user 1 (pooja@example.com with 9823456789)
  // Let's create user 2 in mockUsers
  const user2 = {
    id: "cust_2",
    email: "user2@example.com",
    name: "User Two",
    phone: "9711122233",
    role: "CUSTOMER",
    passwordHash: "pbkdf2.310000.somehash.hash",
    sessionVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUsers.push(user2);

  const token = await signCustomerToken({ id: user2.id, email: user2.email, name: user2.name, sessionVersion: 0 });

  // Attempt to change user 2's phone to user 1's phone (9823456789)
  const req = new NextRequest("https://offvybe.test/api/account", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `ts_customer_session=${token}`,
    },
    body: JSON.stringify({
      phone: "9823456789",
    }),
  });

  const res = await PATCH(req);
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.match(data.error, /already associated with another account/i);
});

test("registration - POST /api/auth/customer/register rejects missing phone with HTTP 400", async () => {
  const { POST } = await import("../../src/app/api/auth/customer/register/route");

  const req = new NextRequest("https://offvybe.test/api/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "No Phone User",
      email: "nophone@example.com",
      password: "LuxuryPassword2026!",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /valid 10-digit mobile number/i);
});

test("account profile - PATCH /api/account rejects invalid phone string without wiping phone", async () => {
  const { PATCH } = await import("../../src/app/api/account/route");
  const { signCustomerToken } = await import("../../src/lib/customer-auth");

  const testUser = {
    id: "cust_3",
    email: "user3@example.com",
    name: "User Three",
    phone: "9812345678",
    role: "CUSTOMER",
    passwordHash: "pbkdf2.310000.somehash.hash",
    sessionVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUsers.push(testUser);

  const token = await signCustomerToken({ id: testUser.id, email: testUser.email, name: testUser.name, sessionVersion: 0 });

  const req = new NextRequest("https://offvybe.test/api/account", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `ts_customer_session=${token}`,
    },
    body: JSON.stringify({
      phone: "invalid-phone",
    }),
  });

  const res = await PATCH(req);
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /valid 10-digit mobile number/i);

  // Verify the phone number was not wiped
  assert.equal(testUser.phone, "9812345678");
});

test("registration - POST /api/auth/customer/register rejects guest checkout email with HTTP 409", async () => {
  const { POST } = await import("../../src/app/api/auth/customer/register/route");

  // Create a guest record (no password)
  const guestUser = {
    id: "guest_1",
    email: "guestshopper@example.com",
    name: "Guest Shopper",
    phone: "9611223344",
    role: "CUSTOMER",
    passwordHash: null,
    sessionVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUsers.push(guestUser);

  const req = new NextRequest("https://offvybe.test/api/auth/customer/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Guest Shopper",
      email: "guestshopper@example.com",
      phone: "9611223344",
      password: "LuxuryPassword2026!",
    }),
  });

  const res = await POST(req);
  assert.equal(res.status, 409);
  const data = await res.json();
  assert.equal(data.success, false);
  assert.match(data.message, /guest orders/i);
});
