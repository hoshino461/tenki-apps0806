import requests
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from geopy.geocoders import ArcGIS

app = FastAPI()

# ジオコーディングサービスをArcGISに変更
geolocator = ArcGIS(user_agent="tenki_app")

@app.get("/api/weather")
def get_weather(location: str):
    """指定された地名の波の高さを取得する"""
    if location == "銚子港":
        lat = 35.74
        lon = 140.85
        resolved_location_name = "銚子港"
    else:
        try:
            # 地名を緯度経度に変換
            location_data = geolocator.geocode(location + ", 日本")
            if location_data is None:
                raise HTTPException(status_code=404, detail=f"「{location}」が見つかりませんでした。")

            lat = location_data.latitude
            lon = location_data.longitude
            resolved_location_name = location_data.address

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ジオコーディング中にエラーが発生しました: {e}")

    # Marine APIで有効なパラメータに修正
    url = f"https://marine-api.open-meteo.com/v1/marine?latitude={lat}&longitude={lon}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=Asia%2FTokyo"

    try:
        response = requests.get(url)
        response.raise_for_status()

        # 取得したデータに、変換後の地名情報も追加して返す
        weather_data = response.json()
        weather_data['resolved_location'] = resolved_location_name
        return weather_data

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=503, detail=f"気象情報サービスへの接続に失敗しました: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"サーバー内部でエラーが発生しました: {e}")

# 静的ファイルの配信
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_index():
    """トップページ (index.html) を返す"""
    return FileResponse('static/index.html')