window.addEventListener('load', () => {
    const form = document.getElementById('weather-form');
    const checkboxesContainer = document.getElementById('location-checkboxes');
    const resultsContainer = document.getElementById('results-container');

    // 表示する港のリスト
    const ports = [
        '多度津港',
        '小松島港',
        '御前崎港',
        '原釜港',
        '大洗港',
        '蒲郡港',
        '郷ノ浦港',
        '魚津港',
        '八戸港',
        '銚子港',
        '境港',
        '苫小牧港',
        '金沢港',
        '酒田港'
    ];

    // 港のリストからチェックボックスを生成
    if (checkboxesContainer) {
        ports.forEach(port => {
            const checkboxDiv = document.createElement('div');
            checkboxDiv.classList.add('checkbox-item');

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = port;
            input.name = 'location';
            input.value = port;

            const label = document.createElement('label');
            label.htmlFor = port;
            label.textContent = port;

            checkboxDiv.appendChild(input);
            checkboxDiv.appendChild(label);
            checkboxesContainer.appendChild(checkboxDiv);
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const selectedPorts = Array.from(document.querySelectorAll('input[name="location"]:checked'))
                .map(cb => cb.value);

            if (selectedPorts.length === 0) {
                resultsContainer.innerHTML = '<p>港を1つ以上選択してください。</p>';
                return;
            }

            resultsContainer.innerHTML = '<p>情報を取得中...</p>';

            const fetchPromises = selectedPorts.map(port =>
                fetch(`/api/weather?location=${encodeURIComponent(port)}`)
                    .then(response => {
                        if (!response.ok) {
                            return response.json().then(err => Promise.reject(err));
                        }
                        return response.json();
                    })
                    .catch(error => ({
                        error: true,
                        location: port,
                        detail: error.detail || '不明なエラー'
                    }))
            );

            try {
                const results = await Promise.all(fetchPromises);
                resultsContainer.innerHTML = ''; // 古い結果をクリア

                results.forEach(data => {
                    const resultCard = document.createElement('div');
                    resultCard.className = 'result-card';

                    if (data.error) {
                        resultCard.innerHTML = `
                            <h3>${data.location}</h3>
                            <p class="error">エラー: ${data.detail}</p>
                        `;
                    } else {
                        const now = new Date();
                        now.setMinutes(0);
                        now.setSeconds(0);
                        now.setMilliseconds(0);
                        const nowISO = now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:00

                        let index = -1;
                        if (data.hourly && data.hourly.time) {
                            index = data.hourly.time.findIndex(t => t.startsWith(nowISO.substring(0, 13)));
                        }

                        if (index !== -1) {
                            const time = new Date(data.hourly.time[index]).toLocaleString('ja-JP');
                            const waveHeight = data.hourly.wave_height[index];
                            const waveDirection = data.hourly.wave_direction[index];
                            const wavePeriod = data.hourly.wave_period[index];
                            const seaSurfaceTemperature = data.hourly.sea_surface_temperature[index];
                            const resolvedLocation = data.resolved_location;

                            resultCard.innerHTML = `
                                <h3>${resolvedLocation}</h3>
                                <p><strong>${time}の予報</strong></p>
                                <ul>
                                    <li>波の高さ: <strong>${waveHeight} m</strong></li>
                                    <li>波の向き: <strong>${waveDirection}°</strong></li>
                                    <li>波の周期: <strong>${wavePeriod} s</strong></li>
                                    <li>海水温: <strong>${seaSurfaceTemperature} °C</strong></li>
                                </ul>
                            `;
                        } else {
                            resultCard.innerHTML = `
                                <h3>${data.resolved_location}</h3>
                                <p>現在の予報データが見つかりませんでした。</p>
                            `;
                        }
                    }
                    resultsContainer.appendChild(resultCard);
                });

            } catch (error) {
                resultsContainer.innerHTML = `<p class="error">全体的なエラーが発生しました: ${error.message}</p>`;
            }
        });
    }

    // --- 天気図表示機能 ---
    const toggleChartBtn = document.getElementById('toggle-chart-btn');
    const chartImageWrapper = document.getElementById('chart-image-wrapper');
    const weatherChartImage = document.getElementById('weather-chart-image');
    const chartUrl = 'https://www.jma.go.jp/bosai/weather_map/img/jpsa.png'; // 気象庁の最新天気図URL

    if (toggleChartBtn) {
        toggleChartBtn.addEventListener('click', () => {
            if (chartImageWrapper.classList.contains('hidden')) {
                // 表示する場合
                if (!weatherChartImage.src) {
                    // 初回クリック時のみ画像を読み込む
                    weatherChartImage.src = `${chartUrl}?v=${new Date().getTime()}`;
                }
                chartImageWrapper.classList.remove('hidden');
                toggleChartBtn.textContent = '天気図を隠す';
            } else {
                // 非表示にする場合
                chartImageWrapper.classList.add('hidden');
                toggleChartBtn.textContent = '天気図を表示';
            }
        });
    }
});