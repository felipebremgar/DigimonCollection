CREATE TABLE `card` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` text NOT NULL,
	`set_code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`form` text,
	`attribute` text,
	`level` text,
	`play_cost` integer,
	`digivolution_cost` integer,
	`use_cost` integer,
	`dp` integer,
	`effect` text NOT NULL,
	`inherited_effect` text,
	`security_effect` text,
	`illustrator` text NOT NULL,
	`notes` text,
	`copy_limit` integer DEFAULT 4 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_number_unique` ON `card` (`number`);--> statement-breakpoint
CREATE INDEX `idx_card_set_code` ON `card` (`set_code`);--> statement-breakpoint
CREATE INDEX `idx_card_category` ON `card` (`category`);--> statement-breakpoint
CREATE INDEX `idx_card_name` ON `card` (`name`);--> statement-breakpoint
CREATE TABLE `card_color` (
	`card_id` integer NOT NULL,
	`color_id` integer NOT NULL,
	PRIMARY KEY(`card_id`, `color_id`),
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`color_id`) REFERENCES `color`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `card_keyword` (
	`card_id` integer NOT NULL,
	`keyword_id` integer NOT NULL,
	PRIMARY KEY(`card_id`, `keyword_id`),
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`keyword_id`) REFERENCES `keyword`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `card_type_link` (
	`card_id` integer NOT NULL,
	`type_id` integer NOT NULL,
	PRIMARY KEY(`card_id`, `type_id`),
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`type_id`) REFERENCES `type`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `color` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `color_name_unique` ON `color` (`name`);--> statement-breakpoint
CREATE TABLE `deck` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deck_card` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deck_id` integer NOT NULL,
	`card_id` integer NOT NULL,
	`printing_id` integer,
	`zone` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`deck_id`) REFERENCES `deck`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`printing_id`) REFERENCES `printing`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_deck_card_deck_id` ON `deck_card` (`deck_id`);--> statement-breakpoint
CREATE INDEX `idx_deck_card_card_id` ON `deck_card` (`card_id`);--> statement-breakpoint
CREATE TABLE `keyword` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`explanation` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `keyword_name_unique` ON `keyword` (`name`);--> statement-breakpoint
CREATE TABLE `link_detail` (
	`card_id` integer PRIMARY KEY NOT NULL,
	`link_cost` integer,
	`link_target_type_id` integer,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`link_target_type_id`) REFERENCES `type`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `printing` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_id` integer NOT NULL,
	`rarity` text NOT NULL,
	`version` text NOT NULL,
	`is_alt_art` integer DEFAULT false NOT NULL,
	`art_url` text NOT NULL,
	`illustrator` text,
	`printing_notes` text,
	FOREIGN KEY (`card_id`) REFERENCES `card`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_printing_card_id` ON `printing` (`card_id`);--> statement-breakpoint
CREATE INDEX `idx_printing_is_alt_art` ON `printing` (`is_alt_art`);--> statement-breakpoint
CREATE TABLE `type` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `type_name_unique` ON `type` (`name`);