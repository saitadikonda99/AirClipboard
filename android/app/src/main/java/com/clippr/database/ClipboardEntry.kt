package com.clippr.database

import androidx.room.*

@Entity(tableName = "clipboard_history")
data class ClipboardEntry(
    @PrimaryKey val id: String,
    val content: String,
    val timestamp: Long,
    val source: String,
    val type: String = "text/plain",
    val direction: String = "received"
)

@Dao
interface ClipboardDao {
    @Query("SELECT * FROM clipboard_history ORDER BY timestamp DESC LIMIT 50")
    suspend fun getAll(): List<ClipboardEntry>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: ClipboardEntry)

    @Query("DELETE FROM clipboard_history")
    suspend fun clearAll()

    @Query("SELECT content FROM clipboard_history ORDER BY timestamp DESC LIMIT 1")
    suspend fun getLatest(): String?
}

@Database(entities = [ClipboardEntry::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun clipboardDao(): ClipboardDao

    companion object {
        @Volatile private var INSTANCE: AppDatabase? = null

        fun getInstance(context: android.content.Context): AppDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(context, AppDatabase::class.java, "clippr.db").build().also { INSTANCE = it }
            }
    }
}
