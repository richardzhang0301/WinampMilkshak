/*
 * LocalAudio.js
 *
 * Modern (2020s) Web Audio backend for milkshake. Replaces the dead
 * SoundCloud/Flash path and the pre-deprecation webkitAudioContext code in
 * the shipped HTML5Audio.js.
 *
 * Responsibilities:
 *   - Play back a URL (including blob: URLs from a file picker) through a
 *     real <audio> element so the user hears the song.
 *   - Tap the audio graph with a ScriptProcessorNode (512 samples, stereo)
 *     and forward each block's PCM into shaker.music.addPCM(L, R) so the
 *     Milkdrop visualizer stays in sync with the audio.
 *
 * Notes:
 *   - ScriptProcessorNode is "deprecated" in favor of AudioWorklet, but it
 *     still works in every shipping browser and keeps this file dependency-
 *     free. Fine for this 2011-era code.
 *   - AudioContext must be resumed from a user gesture. We attach a one-shot
 *     resume on the first click/keydown just in case.
 */

var LocalAudio = Class.extend({
    init: function (url) {
        var self = this;

        // 1. <audio> element -- drives playback to the user's speakers.
        var el = document.createElement('audio');
        el.src = url;
        el.crossOrigin = 'anonymous';
        el.controls = false;
        el.loop = true;
        el.autoplay = true;
        // Stash it in the DOM so it survives and shows up in devtools if needed.
        el.style.display = 'none';
        document.body.appendChild(el);
        this.audioEl = el;

        // 2. Web Audio graph.
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) {
            console.error('[LocalAudio] Web Audio API not supported in this browser.');
            return;
        }
        this.context = new AC();

        // Resume context on first user gesture (autoplay policy).
        var resume = function () {
            if (self.context.state === 'suspended') self.context.resume();
            window.removeEventListener('click', resume);
            window.removeEventListener('keydown', resume);
        };
        window.addEventListener('click', resume);
        window.addEventListener('keydown', resume);

        this.source = this.context.createMediaElementSource(el);

        // 512-sample blocks is what milkshake's Music.addPCM expects by default.
        this.processor = this.context.createScriptProcessor(512, 2, 2);
        this.processor.onaudioprocess = function (event) {
            var inL = event.inputBuffer.getChannelData(0);
            var inR = event.inputBuffer.numberOfChannels > 1
                ? event.inputBuffer.getChannelData(1)
                : inL;

            // Pass-through: copy input to output so audio keeps flowing.
            var outL = event.outputBuffer.getChannelData(0);
            var outR = event.outputBuffer.getChannelData(1);
            for (var i = 0; i < inL.length; i++) {
                outL[i] = inL[i];
                outR[i] = inR[i];
            }

            // Feed the visualizer.
            if (typeof shaker !== 'undefined' && shaker.music) {
                shaker.music.addPCM(inL, inR);
            }
        };

        // source -> processor -> destination
        this.source.connect(this.processor);
        this.processor.connect(this.context.destination);

        // Also connect source directly to destination so audio plays even if
        // ScriptProcessor is ever optimized away on silent tabs. (Safe: the
        // processor's output is a bit-for-bit copy of the input.)
        // -- disabled to avoid 2x volume; the processor pass-through is sufficient.
        // this.source.connect(this.context.destination);

        // Kick playback (returns a promise; may reject if autoplay blocked).
        var p = el.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function (err) {
                console.warn('[LocalAudio] Autoplay blocked, waiting for user gesture:', err && err.message);
            });
        }
    },

    stop: function () {
        try { this.audioEl.pause(); } catch (e) {}
        try { this.processor.disconnect(); } catch (e) {}
        try { this.source.disconnect(); } catch (e) {}
        try { this.context.close(); } catch (e) {}
        if (this.audioEl && this.audioEl.parentNode) {
            this.audioEl.parentNode.removeChild(this.audioEl);
        }
    }
});
