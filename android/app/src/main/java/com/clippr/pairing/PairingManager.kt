package com.clippr.pairing

import android.content.Context
import android.content.SharedPreferences
import android.os.Build
import com.clippr.model.DeviceInfo
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.UUID

class PairingManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("clippr_pairing", Context.MODE_PRIVATE)
    private val gson = Gson()

    fun getMyDeviceId(): String {
        return prefs.getString("my_device_id", null) ?: run {
            val id = "android-${UUID.randomUUID().toString().take(8)}"
            prefs.edit().putString("my_device_id", id).apply()
            id
        }
    }

    fun getMyDeviceName(): String = prefs.getString("my_device_name", null) ?: Build.MODEL

    fun getTrustedDevices(): Map<String, DeviceInfo> {
        val json = prefs.getString("trusted_devices", "{}") ?: "{}"
        val type = object : TypeToken<Map<String, DeviceInfo>>() {}.type
        return gson.fromJson(json, type) ?: emptyMap()
    }

    fun isTrusted(deviceId: String): Boolean = getTrustedDevices().containsKey(deviceId)

    fun getDeviceKey(deviceId: String): String? = getTrustedDevices()[deviceId]?.sharedKey

    fun trustDevice(device: DeviceInfo) {
        val devices = getTrustedDevices().toMutableMap()
        devices[device.deviceId] = device
        prefs.edit().putString("trusted_devices", gson.toJson(devices)).apply()
    }

    fun removeDevice(deviceId: String) {
        val devices = getTrustedDevices().toMutableMap()
        devices.remove(deviceId)
        prefs.edit().putString("trusted_devices", gson.toJson(devices)).apply()
    }
}
