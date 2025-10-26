// API 기본 URL
const API_BASE_URL = 'http://localhost:8000/api';

// 전역 변수
let currentPage = 0;
const itemsPerPage = 12;
let currentFilters = {
    has_step: null,
    width_class: null
};

// Chart 인스턴스
let stepChart = null;
let widthChart = null;
let chairChart = null;
let gradeChart = null;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    setupEventListeners();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 필터 적용
    document.getElementById('applyFilters').addEventListener('click', () => {
        const stepFilter = document.getElementById('filterStep').value;
        const widthFilter = document.getElementById('filterWidth').value;
        
        currentFilters.has_step = stepFilter === '' ? null : stepFilter === 'true';
        currentFilters.width_class = widthFilter === '' ? null : widthFilter;
        currentPage = 0;
        
        loadGallery();
    });
    
    // 페이지네이션
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 0) {
            currentPage--;
            loadGallery();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadGallery();
    });
    
    // 모달 닫기
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('imageModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 대시보드 데이터 로드
async function loadDashboard() {
    try {
        // 요약 데이터 로드
        const summaryResponse = await fetch(`${API_BASE_URL}/summary`);
        const summary = await summaryResponse.json();
        
        // 통계 카드 업데이트
        updateStatCards(summary);
        
        // 차트 업데이트
        updateCharts(summary);
        
        // 갤러리 로드
        loadGallery();
        
    } catch (error) {
        console.error('대시보드 로드 실패:', error);
        alert('데이터를 불러오는데 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
}

// 통계 카드 업데이트
function updateStatCards(summary) {
    document.getElementById('totalImages').textContent = `${summary.total_images}장`;
    document.getElementById('stepFree').textContent = `${summary.step_free_count}장`;
    document.getElementById('stepFreePercent').textContent = `(${summary.step_free_percentage}%)`;
    document.getElementById('avgScore').textContent = `${summary.average_score}점`;
    document.getElementById('avgGrade').textContent = `${summary.average_grade} 등급`;
    
    const excellentCount = summary.grade_distribution.S + summary.grade_distribution.A;
    const excellentPercent = ((excellentCount / summary.total_images) * 100).toFixed(1);
    document.getElementById('excellentCount').textContent = `${excellentCount}장`;
    document.getElementById('excellentPercent').textContent = `(${excellentPercent}%)`;
}

// 차트 업데이트
function updateCharts(summary) {
    // 단차 차트
    const stepCtx = document.getElementById('stepChart').getContext('2d');
    if (stepChart) stepChart.destroy();
    
    const stepFreeCount = summary.total_images - summary.step_free_count;
    stepChart = new Chart(stepCtx, {
        type: 'doughnut',
        data: {
            labels: ['단차 없음', '단차 있음'],
            datasets: [{
                data: [summary.step_free_count, stepFreeCount],
                backgroundColor: ['#28a745', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // 통로 너비 차트
    const widthCtx = document.getElementById('widthChart').getContext('2d');
    if (widthChart) widthChart.destroy();
    
    const widthLabels = [];
    const widthData = [];
    const widthColors = {
        'wide': '#28a745',
        'normal': '#17a2b8',
        'narrow': '#ffc107',
        'not_passable': '#dc3545'
    };
    const widthNames = {
        'wide': 'Wide (넓음)',
        'normal': 'Normal (보통)',
        'narrow': 'Narrow (좁음)',
        'not_passable': '통과 불가'
    };
    
    for (const [key, value] of Object.entries(summary.width_distribution)) {
        widthLabels.push(widthNames[key] || key);
        widthData.push(value);
    }
    
    widthChart = new Chart(widthCtx, {
        type: 'bar',
        data: {
            labels: widthLabels,
            datasets: [{
                label: '개수',
                data: widthData,
                backgroundColor: widthLabels.map(label => {
                    const key = Object.keys(widthNames).find(k => widthNames[k] === label);
                    return widthColors[key] || '#667eea';
                })
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // 의자 타입 차트
    const chairCtx = document.getElementById('chairChart').getContext('2d');
    if (chairChart) chairChart.destroy();
    
    chairChart = new Chart(chairCtx, {
        type: 'bar',
        data: {
            labels: ['이동형', '높이 조절', '고정형', '바닥 좌식'],
            datasets: [{
                label: '개수',
                data: [
                    summary.chair_types.movable,
                    summary.chair_types.high_movable,
                    summary.chair_types.fixed,
                    summary.chair_types.floor
                ],
                backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
    
    // 등급 분포 차트
    const gradeCtx = document.getElementById('gradeChart').getContext('2d');
    if (gradeChart) gradeChart.destroy();
    
    gradeChart = new Chart(gradeCtx, {
        type: 'pie',
        data: {
            labels: ['S', 'A', 'B', 'C', 'D'],
            datasets: [{
                data: [
                    summary.grade_distribution.S,
                    summary.grade_distribution.A,
                    summary.grade_distribution.B,
                    summary.grade_distribution.C,
                    summary.grade_distribution.D
                ],
                backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 갤러리 로드
async function loadGallery() {
    try {
        const skip = currentPage * itemsPerPage;
        let url = `${API_BASE_URL}/images?skip=${skip}&limit=${itemsPerPage}`;
        
        if (currentFilters.has_step !== null) {
            url += `&has_step=${currentFilters.has_step}`;
        }
        if (currentFilters.width_class !== null) {
            url += `&width_class=${currentFilters.width_class}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        // 갤러리 그리드 업데이트
        const galleryGrid = document.getElementById('galleryGrid');
        galleryGrid.innerHTML = '';
        
        if (data.items.length === 0) {
            galleryGrid.innerHTML = '<p style="text-align: center; color: #999; padding: 40px;">검색 결과가 없습니다.</p>';
        } else {
            data.items.forEach(item => {
                const galleryItem = createGalleryItem(item);
                galleryGrid.appendChild(galleryItem);
            });
        }
        
        // 페이지 정보 업데이트
        const totalPages = Math.ceil(data.total / itemsPerPage);
        document.getElementById('pageInfo').textContent = `${currentPage + 1} / ${totalPages || 1}`;
        
        // 버튼 상태 업데이트
        document.getElementById('prevPage').disabled = currentPage === 0;
        document.getElementById('nextPage').disabled = currentPage >= totalPages - 1 || totalPages === 0;
        
    } catch (error) {
        console.error('갤러리 로드 실패:', error);
    }
}

// 갤러리 아이템 생성
function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    const chairTypes = [];
    if (item.chair.has_movable_chair) chairTypes.push('이동형');
    if (item.chair.has_high_movable_chair) chairTypes.push('높이조절');
    if (item.chair.has_fixed_chair) chairTypes.push('고정형');
    if (item.chair.has_floor_chair) chairTypes.push('바닥좌식');
    
    const widthText = item.width_class.map(w => {
        const map = {
            'wide': 'Wide',
            'normal': 'Normal',
            'narrow': 'Narrow',
            'not_passable': '통과불가'
        };
        return map[w] || w;
    }).join(', ');
    
    div.innerHTML = `
        <div class="gallery-item-header">${item.file_path}</div>
        <div class="gallery-item-info">
            <div>단차: ${item.has_step ? '있음 ❌' : '없음 ✅'}</div>
            <div>통로: ${widthText}</div>
            <div>의자: ${chairTypes.join(', ') || '없음'}</div>
        </div>
        <div class="gallery-item-score">
            <span>${item.accessibility.score}점</span>
            <span class="score-badge grade-${item.accessibility.grade}">${item.accessibility.grade}</span>
        </div>
    `;
    
    div.addEventListener('click', () => openModal(item));
    
    return div;
}

// 모달 열기
async function openModal(item) {
    try {
        // 상세 정보 가져오기
        const response = await fetch(`${API_BASE_URL}/images/${encodeURIComponent(item.file_path)}`);
        const detail = await response.json();
        
        // 모달 업데이트
        document.getElementById('modalFileName').textContent = detail.file_path;
        document.getElementById('modalImagePath').textContent = detail.file_path;
        document.getElementById('modalHasStep').textContent = detail.has_step ? '있음 ❌' : '없음 ✅';
        document.getElementById('modalHasStep').style.color = detail.has_step ? '#dc3545' : '#28a745';
        
        const widthText = detail.width_class.map(w => {
            const map = {
                'wide': 'Wide (넓음)',
                'normal': 'Normal (보통)',
                'narrow': 'Narrow (좁음)',
                'not_passable': '통과 불가'
            };
            return map[w] || w;
        }).join(', ');
        document.getElementById('modalWidth').textContent = widthText;
        
        const chairTypes = [];
        if (detail.chair.has_movable_chair) chairTypes.push('이동형');
        if (detail.chair.has_high_movable_chair) chairTypes.push('높이 조절');
        if (detail.chair.has_fixed_chair) chairTypes.push('고정형');
        if (detail.chair.has_floor_chair) chairTypes.push('바닥 좌식');
        document.getElementById('modalChair').textContent = chairTypes.join(', ') || '없음';
        
        document.getElementById('modalScore').textContent = `${detail.accessibility.score}점`;
        document.getElementById('modalGrade').textContent = `${detail.accessibility.grade} 등급`;
        
        // 개선 사항
        const recommendationsDiv = document.getElementById('modalRecommendations');
        recommendationsDiv.innerHTML = '';
        
        if (detail.recommendations && detail.recommendations.length > 0) {
            const h4 = document.createElement('h4');
            h4.textContent = '💡 개선 사항';
            recommendationsDiv.appendChild(h4);
            
            detail.recommendations.forEach(rec => {
                const recDiv = document.createElement('div');
                recDiv.className = `recommendation-item ${rec.priority}`;
                recDiv.innerHTML = `
                    <div class="recommendation-title">${rec.title}</div>
                    <div class="recommendation-desc">${rec.description}</div>
                `;
                recommendationsDiv.appendChild(recDiv);
            });
        } else {
            const p = document.createElement('p');
            p.textContent = '✅ 접근성이 우수합니다!';
            p.style.color = '#28a745';
            p.style.fontWeight = 'bold';
            p.style.textAlign = 'center';
            p.style.padding = '20px';
            recommendationsDiv.appendChild(p);
        }
        
        // 모달 표시
        document.getElementById('imageModal').style.display = 'block';
        
    } catch (error) {
        console.error('모달 로드 실패:', error);
        alert('상세 정보를 불러오는데 실패했습니다.');
    }
}

// 모달 닫기
function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
}

