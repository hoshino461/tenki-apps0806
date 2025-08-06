import requests
import json
from datetime import datetime
import sys
import io

# 標準出力をUTF-8に設定
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def get_choshi_wave_height():
    """銚子港の現在の波の高さを取得する"""
    # 銚子港の緯度経度
    latitude = 35.74
    longitude = 140.85

    # Open-Meteo Marine Weather API のURL
    url = f"https://marine-api.open-meteo.com/v1/marine?latitude={latitude}&longitude={longitude}&hourly=wave_height&timezone=Asia%2FTokyo"

    try:
        response = requests.get(url)
        response.raise_for_status()

        data = response.json()

        now = datetime.now().strftime('%Y-%m-%dT%H:00')
        try:
            index = data['hourly']['time'].index(now)
            current_wave_height = data['hourly']['wave_height'][index]
            time = data['hourly']['time'][index]
            
            print(f"銚子港の波の高さ ({time}時点):")
            print(f"{current_wave_height} メートル")

        except ValueError:
            print("現在の時刻に対応するデータが見つかりませんでした。")
            latest_time = data['hourly']['time'][-1]
            latest_wave_height = data['hourly']['wave_height'][-1]
            print(f"最新のデータ ({latest_time}時点):")
            print(f"{latest_wave_height} メートル")

    except requests.exceptions.RequestException as e:
        print(f"APIへのリクエスト中にエラーが発生しました: {e}")
    except (KeyError, TypeError):
        print("受信したデータの形式が正しくありません。")

if __name__ == "__main__":
    get_choshi_wave_height()