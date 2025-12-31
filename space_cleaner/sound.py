# sound.py
# 프로시저럴 사운드 생성 모듈

import pygame
import random
import struct
import io
import math


def generate_sound(wave_type="square", frequency=440, duration=0.1, volume=0.5):
    """
    메모리 상에서 WAV 파일 데이터를 직접 생성하여 Sound 객체로 반환
    외부 파일 로딩 없이 효과음을 생성하기 위함

    Args:
        wave_type: "square" (레이저 사운드) 또는 "noise" (폭발 사운드)
        frequency: 사운드 주파수 (Hz)
        duration: 사운드 길이 (초)
        volume: 볼륨 (0.0 ~ 1.0)

    Returns:
        pygame.mixer.Sound 객체
    """
    sample_rate = 44100
    n_samples = int(sample_rate * duration)

    # WAV Header
    header = io.BytesIO()
    header.write(b"RIFF")
    header.write(struct.pack("<I", 36 + n_samples))
    header.write(b"WAVEfmt ")
    header.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate, 1, 8))
    header.write(b"data")
    header.write(struct.pack("<I", n_samples))

    data = bytearray()

    for i in range(n_samples):
        t = i / sample_rate
        value = 128

        if wave_type == "square":
            # 사각파 (삐- 소리)
            if math.sin(2 * math.pi * frequency * t) > 0:
                value = 128 + int(127 * volume)
            else:
                value = 128 - int(127 * volume)

            # 피치 하강 효과 (레이저 느낌)
            frequency -= 1000 / sample_rate

        elif wave_type == "noise":
            # 화이트 노이즈 (폭발음)
            value = random.randint(128 - int(127 * volume), 128 + int(127 * volume))
            # 감쇠 (뒤로 갈수록 소리 작아짐)
            decay = 1 - (i / n_samples)
            value = 128 + int((value - 128) * decay)

        data.append(max(0, min(255, value)))

    return pygame.mixer.Sound(io.BytesIO(header.getvalue() + data))
