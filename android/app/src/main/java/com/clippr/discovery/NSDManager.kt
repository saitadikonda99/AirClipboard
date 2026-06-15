package com.clippr.discovery

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.util.Log

class ClipprNSDManager(private val context: Context) {
    private val nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var resolveInProgress = false
    private val pendingResolve = ArrayDeque<NsdServiceInfo>()

    companion object {
        const val SERVICE_TYPE = "_clippr._tcp."
        private const val TAG = "ClipprNSD"
    }

    fun startDiscovery(onFound: (host: String, port: Int) -> Unit) {
        stopDiscovery()

        discoveryListener = object : NsdManager.DiscoveryListener {
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) {
                Log.e(TAG, "Discovery start failed: $errorCode")
            }
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) {}
            override fun onDiscoveryStarted(serviceType: String) { Log.d(TAG, "Discovery started") }
            override fun onDiscoveryStopped(serviceType: String) { Log.d(TAG, "Discovery stopped") }

            override fun onServiceFound(service: NsdServiceInfo) {
                if (service.serviceType.contains("_clippr._tcp")) {
                    resolveService(service, onFound)
                }
            }

            override fun onServiceLost(service: NsdServiceInfo) {
                Log.d(TAG, "Service lost: ${service.serviceName}")
            }
        }

        nsdManager.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, discoveryListener)
    }

    private fun resolveService(service: NsdServiceInfo, onFound: (String, Int) -> Unit) {
        if (resolveInProgress) {
            pendingResolve.addLast(service)
            return
        }
        resolveInProgress = true
        nsdManager.resolveService(service, object : NsdManager.ResolveListener {
            override fun onResolveFailed(info: NsdServiceInfo, errorCode: Int) {
                Log.e(TAG, "Resolve failed: $errorCode")
                resolveInProgress = false
                processPending(onFound)
            }

            override fun onServiceResolved(info: NsdServiceInfo) {
                val host = info.host?.hostAddress ?: return
                val port = info.port
                Log.d(TAG, "Resolved: $host:$port")
                onFound(host, port)
                resolveInProgress = false
                processPending(onFound)
            }
        })
    }

    private fun processPending(onFound: (String, Int) -> Unit) {
        if (pendingResolve.isNotEmpty()) {
            resolveService(pendingResolve.removeFirst(), onFound)
        }
    }

    fun stopDiscovery() {
        discoveryListener?.let {
            try { nsdManager.stopServiceDiscovery(it) } catch (_: Exception) {}
        }
        discoveryListener = null
    }
}
