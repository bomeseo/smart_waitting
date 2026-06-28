// ---------------------------------------------------------------------------
// 대기 시간 계산 담당
// ---------------------------------------------------------------------------
// 공식:
// - 대기 인원 = 전체 예약 인원 - 이용 완료 횟수
// - 예상 대기 시간 = 대기 인원 x 평균 이용 시간
// - 예상 입장 시각 = 현재 시각 + 남은 대기 시간

(function () {
  // 매번 최신 데이터를 window.SmartWaitingData에서 가져오는 헬퍼 함수
  function getData() {
    const rawData = window.SmartWaitingData;
    // 초기 data.js가 배열인 경우와 network.js의 객체 형태를 모두 지원
    if (Array.isArray(rawData)) {
      return { startedAt: Date.now(), contents: rawData };
    }
    return {
      startedAt: rawData?.startedAt || Date.now(),
      contents: rawData?.contents || []
    };
  }

  function findContent(id) {
    const { contents } = getData();
    return contents.find((item) => item.id === id) || contents[0];
  }

  function clock(date) {
    // 유효하지 않은 날짜 오브젝트가 들어오면 기본 대시(--:--) 반환
    if (!date || isNaN(date.getTime())) return "--:--";
    
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function cycleMs(item) {
    return (item.average || 0) * 60 * 1000;
  }

  function completedNow(item) {
    const { startedAt } = getData();
    const cycle = cycleMs(item);
    if (cycle === 0) return item.completed || 0;

    const passedCycles = Math.floor((Date.now() - startedAt) / cycle);
    return Math.min(item.reserved || 0, (item.completed || 0) + passedCycles);
  }

  function waitingPeople(item) {
    return Math.max(0, (item.reserved || 0) - completedNow(item));
  }

  function remainingMs(item) {
    const { startedAt } = getData();
    const people = waitingPeople(item); // reserved=0, completed=0 이므로 people = 0
    const cycle = cycleMs(item);        // item.average * 60 * 1000
    
    if (people === 0 || cycle === 0) return 0; // -> 여기서 원래 0을 반환해야 함!
    
    return people * cycle - ((Date.now() - startedAt) % cycle);
  }

  function waitMinutes(item) {
    return Math.ceil(remainingMs(item) / 60000);
  }

  function entryTime(item) {
    const ms = remainingMs(item);
    return clock(new Date(Date.now() + ms));
  }

  function statusText(item) {
    const minutes = waitMinutes(item);
    if (minutes <= 15) return "한적함";
    if (minutes >= 40) return "혼잡함";
    return "예약 가능";
  }

  function summary() {
    const { contents } = getData();
    
    // [수정] 데이터가 없거나 배열이 비어있으면 기본값(0)을 즉시 반환하여 0으로 나누기 방지
    if (!contents || contents.length === 0) {
      return { totalWaiting: 0, averageWait: 0, fastEntry: "--:--" };
    }
    
    const totalWaiting = contents.reduce((sum, item) => sum + waitingPeople(item), 0);
    
    // 안전하게 평균 계산
    const averageWait = Math.round(
      contents.reduce((sum, item) => sum + waitMinutes(item), 0) / contents.length
    );
    
    const validMs = contents.map(remainingMs).filter(ms => !isNaN(ms) && isFinite(ms));
    const fastEntryMs = validMs.length > 0 ? Math.min(...validMs) : 0;

    return {
      totalWaiting,
      averageWait,
      fastEntry: clock(new Date(Date.now() + fastEntryMs)),
    };
  }

  // UI 스크립트가 사용할 수 있도록 getter 형태로 묶어 제공
  window.SmartWaitingCore = {
    get contents() { return getData().contents; },
    clock,
    entryTime,
    findContent,
    summary,
    statusText,
    waitingPeople,
    waitMinutes,
  };
})();