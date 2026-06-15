package com.clippr.security

import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import java.security.SecureRandom

object CryptoManager {
    private const val ALGORITHM = "AES/GCM/NoPadding"
    private const val IV_LEN = 12
    private const val TAG_LEN_BYTES = 16
    private const val TAG_LEN_BITS = 128

    // Wire format: [iv (12)] [tag (16)] [ciphertext (n)]
    // Matches the Mac's Node.js crypto.js layout exactly.
    fun encrypt(text: String, hexKey: String): String {
        val key = hexKey.hexToBytes()
        val iv = ByteArray(IV_LEN).also { SecureRandom().nextBytes(it) }
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(TAG_LEN_BITS, iv))
        val jvmOut = cipher.doFinal(text.toByteArray(Charsets.UTF_8))
        // JVM AES-GCM appends tag at the END: jvmOut = [ciphertext][tag]
        val ciphertext = jvmOut.copyOfRange(0, jvmOut.size - TAG_LEN_BYTES)
        val tag = jvmOut.copyOfRange(jvmOut.size - TAG_LEN_BYTES, jvmOut.size)
        return Base64.encodeToString(iv + tag + ciphertext, Base64.NO_WRAP)
    }

    fun decrypt(b64: String, hexKey: String): String {
        val key = hexKey.hexToBytes()
        val buf = Base64.decode(b64, Base64.NO_WRAP)
        val iv = buf.copyOfRange(0, IV_LEN)
        val tag = buf.copyOfRange(IV_LEN, IV_LEN + TAG_LEN_BYTES)
        val ciphertext = buf.copyOfRange(IV_LEN + TAG_LEN_BYTES, buf.size)
        // JVM AES-GCM expects [ciphertext][tag]
        val cipher = Cipher.getInstance(ALGORITHM)
        cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(key, "AES"), GCMParameterSpec(TAG_LEN_BITS, iv))
        return String(cipher.doFinal(ciphertext + tag), Charsets.UTF_8)
    }

    private fun String.hexToBytes(): ByteArray {
        val len = this.length
        return ByteArray(len / 2) { i -> this.substring(i * 2, i * 2 + 2).toInt(16).toByte() }
    }
}
