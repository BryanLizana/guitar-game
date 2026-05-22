package com.guitareffects.presentation.diagnostic

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.guitareffects.databinding.FragmentDiagnosticBinding
import com.guitareffects.domain.model.DiagnosticInfo
import com.guitareffects.presentation.MainViewModel
import kotlinx.coroutines.launch

class DiagnosticDialogFragment : DialogFragment() {

    private var _binding: FragmentDiagnosticBinding? = null
    private val binding get() = _binding!!

    private val viewModel: MainViewModel by activityViewModels()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentDiagnosticBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        dialog?.setTitle("Audio Pipeline Diagnostics")

        binding.btnClose.setOnClickListener { dismiss() }
        binding.btnClear.setOnClickListener {
            binding.tvErrorLog.text = "(cleared)"
        }

        viewLifecycleOwner.lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.diagnosticInfo.collect { info ->
                    renderDiagnostics(info)
                }
            }
        }
    }

    private fun renderDiagnostics(info: DiagnosticInfo) {
        binding.tvSampleRate.text = if (info.sampleRate > 0) "${info.sampleRate} Hz" else "—"
        binding.tvBufferSize.text = if (info.bufferSizeFrames > 0) "${info.bufferSizeFrames} frames" else "—"
        binding.tvAudioSource.text = info.audioSourceInUse.ifEmpty { "—" }
        binding.tvUnprocessed.text = if (info.isUnprocessedSourceSupported) "YES (low-noise)" else "NO (fallback MIC)"
        binding.tvRecordState.text = info.recordState
        binding.tvTrackState.text = info.trackState
        binding.tvLatency.text = if (info.estimatedLatencyMs > 0) "${"%.1f".format(info.estimatedLatencyMs)} ms" else "—"
        binding.tvUnderruns.text = info.underrunCount.toString()
        binding.tvFrames.text = info.totalFramesProcessed.toString()
        binding.tvPermission.text = if (info.micPermissionGranted) "GRANTED" else "DENIED"

        binding.tvErrorLog.text = if (info.errorLog.isEmpty()) {
            "(no errors)"
        } else {
            info.errorLog.takeLast(20).joinToString("\n")
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        const val TAG = "DiagnosticDialog"
        fun newInstance() = DiagnosticDialogFragment()
    }
}
