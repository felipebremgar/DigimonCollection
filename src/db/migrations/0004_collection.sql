CREATE TABLE `collection` (
	`printing_id` integer PRIMARY KEY NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`wishlist` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`printing_id`) REFERENCES `printing`(`id`) ON UPDATE no action ON DELETE cascade
);
