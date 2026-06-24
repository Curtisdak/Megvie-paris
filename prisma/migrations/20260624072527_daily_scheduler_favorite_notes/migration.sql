-- RenameIndex
ALTER INDEX "bible_favorites_user_verse_translation_key" RENAME TO "bible_favorites_user_id_book_chapter_verse_start_verse_end__key";

-- RenameIndex
ALTER INDEX "bible_notes_user_verse_translation_key" RENAME TO "bible_notes_user_id_book_chapter_verse_start_verse_end_tran_key";
