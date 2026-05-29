import { pgTable, serial, timestamp, varchar, boolean, integer, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		email: varchar("email", { length: 255 }).notNull().unique(),
		name: varchar("name", { length: 128 }).notNull(),
		password_hash: varchar("password_hash", { length: 255 }).notNull(),
		role: varchar("role", { length: 20 }).notNull().default('employee'),
		is_active: boolean("is_active").default(true).notNull(),
		storage_quota: integer("storage_quota").default(10737418240).notNull(), // 默认10GB (10 * 1024 * 1024 * 1024)
		last_active_at: timestamp("last_active_at", { withTimezone: true }), // 最后活跃时间，用于判断在线状态
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("users_email_idx").on(table.email),
		index("users_role_idx").on(table.role),
	]
);

// 文件元数据表
export const files = pgTable(
	"files",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		file_key: varchar("file_key", { length: 500 }).notNull(),
		file_name: varchar("file_name", { length: 255 }).notNull(),
		file_size: integer("file_size").notNull(),
		file_type: varchar("file_type", { length: 100 }),
		uploader_id: varchar("uploader_id", { length: 36 }).notNull().references(() => users.id),
		folder_path: varchar("folder_path", { length: 500 }).default('/'),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("files_uploader_id_idx").on(table.uploader_id),
		index("files_folder_path_idx").on(table.folder_path),
		index("files_created_at_idx").on(table.created_at),
	]
);

// 公告表
export const announcements = pgTable(
	"announcements",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		title: varchar("title", { length: 255 }).notNull(),
		content: text("content").notNull(),
		author_id: varchar("author_id", { length: 36 }).notNull().references(() => users.id),
		is_pinned: boolean("is_pinned").default(false).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("announcements_author_id_idx").on(table.author_id),
		index("announcements_is_pinned_idx").on(table.is_pinned),
		index("announcements_created_at_idx").on(table.created_at),
	]
);

// 消息表（站内即时通讯）
export const messages = pgTable(
	"messages",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		sender_id: varchar("sender_id", { length: 36 }).notNull().references(() => users.id),
		receiver_id: varchar("receiver_id", { length: 36 }).notNull().references(() => users.id),
		content: text("content").notNull(),
		is_read: boolean("is_read").default(false).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("messages_sender_id_idx").on(table.sender_id),
		index("messages_receiver_id_idx").on(table.receiver_id),
		index("messages_is_read_idx").on(table.is_read),
		index("messages_created_at_idx").on(table.created_at),
	]
);
