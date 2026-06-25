// ---------------------------------------------------------------------------
// 대기 시간 계산과 저장 담당
// ---------------------------------------------------------------------------
// 공식:
// - 대기 인원 = 전체 예약 인원 - 이용 완료 횟수
// - 예상 대기 시간 = 대기 인원 x 평균 이용 시간
// - 예상 입장 시각 = 현재 시각 + 남은 대기 시간
(function () {
  const storageKey = "smartWaitingContents";
  const baseContents = window.SmartWaitingData;
  const contents = loadContents();

  function loadContents() {
    const startedAt = Date.now();

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (!Array.isArray(saved)) return cloneBase(startedAt);

      return baseContents.map((base) => {
        const match = saved.find((item) => item.id === base.id);
        return {
          ...base,
          reserved: Number(match?.reserved ?? base.reserved),
          completed: Number(match?.completed ?? base.completed),
          average: Number(match?.average ?? base.average),
          startedAt
        };
      });
    } catch (error) {
      return cloneBase(startedAt);
    }
  }

  function cloneBase(startedAt) {
    return baseContents.map((item) => ({ ...item, startedAt }));
  }

  function saveContents() {
    const payload = contents.map(({ id, reserved, completed, average }) => ({
      id,
      reserved,
      completed,
      average
    }));

    localStorage.setItem(storageKey, JSON.stringify(payload));
  }

  function findContent(id) {
    return contents.find((item) => item.id === id) || contents[0];
  }

  function clock(date) {
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }

  function cycleMs(item) {
    return item.average * 60 * 1000;
  }

  function completedNow(item) {
    const passedCycles = Math.floor((Date.now() - item.startedAt) / cycleMs(item));
    return Math.min(item.reserved, item.completed + passedCycles);
  }

  function waitingPeople(item) {
    return Math.max(0, item.reserved - completedNow(item));
  }

  function remainingMs(item) {
    const people = waitingPeople(item);
    if (people === 0) return 0;
    return people * cycleMs(item) - ((Date.now() - item.startedAt) % cycleMs(item));
  }

  function waitMinutes(item) {
    return Math.ceil(remainingMs(item) / 60000);
  }

  function entryTime(item) {
    return clock(new Date(Date.now() + remainingMs(item)));
  }

  function statusText(item) {
    const minutes = waitMinutes(item);
    if (minutes <= 15) return "추천";
    if (minutes >= 40) return "혼잡";
    return "예약 가능";
  }

  function summary() {
    const totalWaiting = contents.reduce((sum, item) => sum + waitingPeople(item), 0);
    const averageWait = Math.round(contents.reduce((sum, item) => sum + waitMinutes(item), 0) / contents.length);
    const fastEntryMs = Math.min(...contents.map(remainingMs));

    return {
      totalWaiting,
      averageWait,
      fastEntry: clock(new Date(Date.now() + fastEntryMs))
    };
  }

  window.SmartWaitingCore = {
    contents,
    clock,
    entryTime,
    findContent,
    saveContents,
    summary,
    statusText,
    waitingPeople,
    waitMinutes
  };
})();
