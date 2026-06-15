package com.clippr.security

import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom

object CryptoManager {
    private const val ALGORITHM = "AES/GCM/NoPadding"
    private const val IV_LEN = 12
    private const val TAG_LEN = 128 // bits

    fun encrypt(text: String, hexKey: String): String {
        val key = hexKey.hexToBytes()
        val iv = ByteArray(IV_LEN).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(TAG_LEN, iv))
        val encrypted = cipher.doFinal(text.toByteArray(Charsets.UTF_8))
        val combined = iv + encrypted
        return Base64.encodeToString(combined, Base64.NO_WRAP)
    }

    fun decrypt(b64: String, hexKey: String): String {
        val key = hexKey.hexToBytes()
        val combined = Base64.decode(b64, Base64.NO_WRAP)
        val iv = combined.copyOfRange(0, IV_LEN)
        val encrypted = combined.copyOfRange(IV_LEN, combined.size)
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(TAG_LEN, iv))
        return String(cipher.doFinal(encrypted), Charsets.UTF_8)
    }

    private fun String.hexToBytes(): ByteArray {
        val len = this.length
        return ByteArray(len / 2) { i -> this.substring(i * 2, i * 2 + 2).toInt(16).toByte() }
    }
}
