"""
Karigar AI -- Voice tools (STT + TTS).
Uses Google Cloud Speech-to-Text and Text-to-Speech APIs.
"""

import logging

from google.cloud import speech_v2 as speech
from google.cloud import texttospeech
from config import settings

logger = logging.getLogger("karigar.voice")


# ---------------------------------------------------------------------------
# Speech-to-Text
# ---------------------------------------------------------------------------

def transcribe_audio(audio_bytes: bytes, language_code: str = "ur-PK") -> dict:
    """Transcribe audio bytes to text using Google Cloud STT.

    Parameters
    ----------
    audio_bytes   : raw audio (LINEAR16 / WAV recommended)
    language_code : BCP-47 code, defaults to Urdu (Pakistan)

    Returns
    -------
    dict with transcript, confidence, language_detected
    """
    try:
        client = speech.SpeechClient()

        # Build recognition config
        config = speech.RecognitionConfig(
            auto_decoding_config=speech.AutoDetectDecodingConfig(),
            language_codes=[language_code, "en-US"],
            model="long",  # works for most lengths; use "chirp_2" when available
        )

        project = settings.google_cloud_project
        recognizer = f"projects/{project}/locations/global/recognizers/_"

        request = speech.RecognizeRequest(
            recognizer=recognizer,
            config=config,
            content=audio_bytes,
        )

        response = client.recognize(request=request)

        if response.results:
            best = response.results[0].alternatives[0]
            detected = language_code
            if response.results[0].language_code:
                detected = response.results[0].language_code
            return {
                "transcript": best.transcript,
                "confidence": round(best.confidence, 3),
                "language_detected": detected,
            }

        return {"transcript": "", "confidence": 0.0, "language_detected": language_code}

    except Exception as e:
        logger.error("STT error: %s", e)
        return {"transcript": "", "confidence": 0.0, "error": str(e)}


# ---------------------------------------------------------------------------
# Text-to-Speech
# ---------------------------------------------------------------------------

def text_to_speech(text: str, language_code: str = "ur-PK") -> bytes:
    """Convert text to speech audio (MP3) using Google Cloud TTS.

    Parameters
    ----------
    text          : the string to synthesize
    language_code : BCP-47 code, defaults to Urdu (Pakistan)

    Returns
    -------
    bytes -- MP3 audio content, or empty bytes on error
    """
    try:
        client = texttospeech.TextToSpeechClient()

        synthesis_input = texttospeech.SynthesisInput(text=text)

        # Pick the right voice based on language
        if language_code.startswith("ur"):
            voice_name = "ur-PK-Wavenet-A"
        else:
            voice_name = "en-US-Wavenet-F"

        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name,
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
        )

        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config,
        )

        return response.audio_content

    except Exception as e:
        logger.error("TTS error: %s", e)
        return b""
