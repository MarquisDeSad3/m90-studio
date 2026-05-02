import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

const id = (prefix: string) =>
  text("id")
    .primaryKey()
    .$defaultFn(() => `${prefix}_${createId()}`)

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}

/* ============================================================
   ENUMS
   ============================================================ */

export const phoneBrandEnum = pgEnum("phone_brand", [
  "apple",
  "samsung",
  "xiaomi",
  "huawei",
  "motorola",
  "other",
])

export const orderStatusEnum = pgEnum("order_status", [
  "draft",          // user designed but didn't send to whatsapp yet
  "submitted",      // sent to whatsapp, awaiting confirmation
  "confirmed",      // M90 confirmed by chat
  "in_production",  // printing
  "ready",          // ready for pickup/shipping
  "delivered",      // done
  "cancelled",
])

export const adminRoleEnum = pgEnum("admin_role", [
  "owner",
  "manager",
  "staff",
])

/* ============================================================
   PHONE MODELS — catalog of supported devices.
   Mockup geometry stored here so the editor can render a faithful
   preview without hardcoding measurements per component.
   ============================================================ */

export const phoneModels = pgTable(
  "phone_models",
  {
    id: id("pm"),
    slug: text("slug").notNull(),
    brand: phoneBrandEnum("brand").notNull(),
    name: text("name").notNull(),
    aliases: jsonb("aliases").$type<string[]>().default([]).notNull(),
    // Physical dimensions in mm — used for display only, not print.
    widthMm: integer("width_mm").notNull(),
    heightMm: integer("height_mm").notNull(),
    cornerRadiusMm: integer("corner_radius_mm").default(8).notNull(),
    // Camera bump bbox in mm, top-left origin from device front.
    cameraX: integer("camera_x"),
    cameraY: integer("camera_y"),
    cameraW: integer("camera_w"),
    cameraH: integer("camera_h"),
    popularity: integer("popularity").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("phone_models_slug_uq").on(t.slug),
    index("phone_models_brand_idx").on(t.brand),
    index("phone_models_popularity_idx").on(t.popularity),
  ],
)

/* ============================================================
   USERS — phone + password.
   No email required (Cuba context, WhatsApp-first audience).
   ============================================================ */

export const users = pgTable(
  "users",
  {
    id: id("usr"),
    phone: text("phone").notNull(),       // E.164 ish: 5355XXXXXX
    passwordHash: text("password_hash").notNull(),
    name: text("name"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_phone_uq").on(t.phone)],
)

export const userSessions = pgTable(
  "user_sessions",
  {
    id: id("uses"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("user_sessions_token_uq").on(t.tokenHash),
    index("user_sessions_user_idx").on(t.userId),
  ],
)

/* ============================================================
   ADMIN — separate auth surface for M90 staff.
   ============================================================ */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: id("adm"),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: adminRoleEnum("role").default("staff").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("admin_users_email_uq").on(t.email)],
)

export const adminSessions = pgTable(
  "admin_sessions",
  {
    id: id("ases"),
    adminId: text("admin_id")
      .notNull()
      .references(() => adminUsers.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("admin_sessions_token_uq").on(t.tokenHash),
    index("admin_sessions_admin_idx").on(t.adminId),
  ],
)

/* ============================================================
   ORDERS — the case design + production tracking.
   Each order has 1 case, with N photo slots and 1 layout.
   ============================================================ */

export const orders = pgTable(
  "orders",
  {
    id: id("ord"),
    code: text("code").notNull(),
    /** Opcional: se setea si el cliente loggeo en algun momento. MVP permite
        ordenes anonimas (guest checkout) — el "usuario" lo tracketamos por
        WhatsApp inbound del cliente. */
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    customerPhone: text("customer_phone"),
    customerName: text("customer_name"),
    /** Snapshot del catalogo (constantes del codigo, no FK). */
    phoneModelSlug: text("phone_model_slug").notNull(),
    phoneModelName: text("phone_model_name").notNull(),
    layoutId: text("layout_id").notNull(),
    layoutName: text("layout_name").notNull(),
    /** Dimensiones fisicas del case (snapshot al crear pedido — el catalogo
        puede cambiar despues). Usadas para generar print-ready a 300 DPI. */
    widthMm: integer("width_mm"),
    heightMm: integer("height_mm"),
    cornerRadiusMm: integer("corner_radius_mm"),
    cameraBox: jsonb("camera_box").$type<{
      x: number;
      y: number;
      w: number;
      h: number;
    } | null>(),
    status: orderStatusEnum("status").default("submitted").notNull(),

    // Computed/exported assets (S3-ish URLs once uploaded)
    previewUrl: text("preview_url"),       // small JPG/PNG of the mockup
    printReadyUrl: text("print_ready_url"),// hires PNG/PDF for the printer

    // Free-form fields
    customerNotes: text("customer_notes"),
    adminNotes: text("admin_notes"),

    // Pricing snapshot at order time (CUP)
    priceCup: integer("price_cup").notNull(),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_code_uq").on(t.code),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
  ],
)

/* Each photo the user uploaded into a slot of the layout.
   `transform` stores crop/zoom/rotate so we can re-render the design
   exactly the same way later (admin view, print export). */
export const orderPhotos = pgTable(
  "order_photos",
  {
    id: id("ophoto"),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    slotIndex: integer("slot_index").notNull(), // 0..N-1
    originalUrl: text("original_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    // Crop/zoom/rotate state from react-easy-crop
    transform: jsonb("transform")
      .$type<{
        crop: { x: number; y: number }
        zoom: number
        rotation: number
        aspect?: number
      }>()
      .notNull(),
    widthPx: integer("width_px"),
    heightPx: integer("height_px"),
    sizeBytes: integer("size_bytes"),
    ...timestamps,
  },
  (t) => [index("order_photos_order_idx").on(t.orderId)],
)

/* Status changes log so admin (and user) can see history. */
export const orderEvents = pgTable(
  "order_events",
  {
    id: id("oev"),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    note: text("note"),
    actor: text("actor"),                 // "user" | "admin:adm_xxx" | "system"
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId)],
)

/* ============================================================
   RELATIONS
   ============================================================ */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(userSessions),
  orders: many(orders),
}))

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  photos: many(orderPhotos),
  events: many(orderEvents),
}))

export const orderPhotosRelations = relations(orderPhotos, ({ one }) => ({
  order: one(orders, {
    fields: [orderPhotos.orderId],
    references: [orders.id],
  }),
}))

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
}))

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  sessions: many(adminSessions),
}))

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  admin: one(adminUsers, {
    fields: [adminSessions.adminId],
    references: [adminUsers.id],
  }),
}))

/* ============================================================
   TYPES
   ============================================================ */

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type PhoneModel = typeof phoneModels.$inferSelect
export type OrderPhoto = typeof orderPhotos.$inferSelect
