const baseContents = [
  {
    id: "vr",
    name: "VR 건강 체험",
    desc: "균형 감각과 가벼운 운동 동작을 가상 공간에서 체험합니다.",
    reserved: 18,
    completed: 9,
    average: 7,
    accent: "#1f6feb",
    scene: "linear-gradient(135deg, #cfe9ff, #5f8fe8 52%, #244a94)",
    startedAt: Date.now()
  },
  {
    id: "photo",
    name: "AI 사진관",
    desc: "사진 촬영 후 인공지능 보정으로 프로필 이미지를 제작합니다.",
    reserved: 14,
    completed: 10,
    average: 5,
    accent: "#c64f7c",
    scene: "linear-gradient(135deg, #ffe1eb, #ed7aa0 52%, #9b315a)",
    startedAt: Date.now()
  },
  {
    id: "kiosk",
    name: "키오스크 연습",
    desc: "주문, 결제, 발권 과정을 실제 상황처럼 천천히 연습합니다.",
    reserved: 21,
    completed: 12,
    average: 6,
    accent: "#d97706",
    scene: "linear-gradient(135deg, #ffe9b8, #f1aa35 52%, #8a4f0f)",
    startedAt: Date.now()
  },
  {
    id: "robot",
    name: "돌봄 로봇 체험",
    desc: "음성 안내와 생활 보조 기능을 직접 확인합니다.",
    reserved: 11,
    completed: 8,
    average: 9,
    accent: "#6b5bd6",
    scene: "linear-gradient(135deg, #e4e0ff, #9a8cf1 52%, #5143a8)",
    startedAt: Date.now()
  }
];

function loadContents() {
  try {
    const saved = JSON.parse(localStorage.getItem("smartWaitingContents") || "null");
    if (Array.isArray(saved) && saved.length) {
      const now = Date.now();
      return baseContents.map((base) => {
        const match = saved.find((item) => item.id === base.id);
        return {
          ...base,
          reserved: Number(match?.reserved ?? base.reserved),
          completed: Number(match?.completed ?? base.completed),
          average: Number(match?.average ?? base.average),
          startedAt: now
        };
      });
    }
  } catch (error) {
    return baseContents.map((item) => ({ ...item, startedAt: Date.now() }));
  }
  return baseContents.map((item) => ({ ...item, startedAt: Date.now() }));
}

function saveContents() {
  const payload = contents.map(({ id, reserved, completed, average }) => ({ id, reserved, completed, average }));
  localStorage.setItem("smartWaitingContents", JSON.stringify(payload));
}

const contents = loadContents();

let filter = "all";

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return [...document.querySelectorAll(selector)];
}

function clock(date, seconds = false) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: seconds ? "2-digit" : undefined,
    hour12: false
  }).format(date);
}

function cycle(item) {
  return item.average * 60 * 1000;
}

function completedNow(item) {
  return Math.min(item.reserved, item.completed + Math.floor((Date.now() - item.startedAt) / cycle(item)));
}

function waitingPeople(item) {
  return Math.max(0, item.reserved - completedNow(item));
}

function remainMs(item) {
  const count = waitingPeople(item);
  if (count === 0) return 0;
  return count * cycle(item) - ((Date.now() - item.startedAt) % cycle(item));
}

function waitMin(item) {
  return Math.ceil(remainMs(item) / 60000);
}

function entryTime(item) {
  return clock(new Date(Date.now() + remainMs(item)));
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1500);
}

function setupDrawer() {
  const drawer = $("#drawer");
  if (!drawer) return;

  $all("[data-menu-open]").forEach((button) => {
    button.addEventListener("click", () => {
      drawer.classList.add("open");
      drawer.setAttribute("aria-hidden", "false");
    });
  });

  $all("[data-menu-close]").forEach((button) => {
    button.addEventListener("click", () => {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    });
  });

  drawer.addEventListener("click", (event) => {
    if (event.target === drawer) {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    }
  });
}

function visibleContents() {
  return contents.filter((item) => {
    const minutes = waitMin(item);
    if (filter === "fast") return minutes <= 15;
    if (filter === "busy") return minutes >= 40;
    return true;
  });
}

function renderHome() {
  const list = $("#contentList");
  if (!list) return;

  const totalWaiting = contents.reduce((sum, item) => sum + waitingPeople(item), 0);
  const avgWait = Math.round(contents.reduce((sum, item) => sum + waitMin(item), 0) / contents.length);
  const fastEntryMs = Math.min(...contents.map(remainMs));

  $("#nowTime").textContent = clock(new Date());
  $("#totalWaiting").textContent = totalWaiting;
  $("#avgWait").textContent = `${avgWait}분`;
  $("#fastEntry").textContent = clock(new Date(Date.now() + fastEntryMs));

  const cards = visibleContents().map((item) => `
    <article class="content-card" style="--accent:${item.accent}">
      <div class="visual" style="--scene:${item.scene}">
        <span class="card-tag">${waitMin(item) <= 15 ? "추천" : waitMin(item) >= 40 ? "혼잡" : "예약 가능"}</span>
        <span class="scene-people" aria-hidden="true"></span>
      </div>
      <div class="wait-badge">
        <div><span>예상대기</span><strong>${waitMin(item)}</strong><small>분</small></div>
      </div>
      <div class="card-body">
        <h2>${item.name}</h2>
        <p>${item.desc}</p>
        <div class="meta">
          <span>대기 ${waitingPeople(item)}명</span>
          <span>평균 ${item.average}분</span>
          <span>입장 ${entryTime(item)}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="primary" data-issue="${item.id}">대기표 받기</button>
        <a href="detail.html?id=${item.id}">자세히</a>
      </div>
    </article>
  `).join("");

  list.innerHTML = cards || `
    <article class="plain-card">
      <h2>조건에 맞는 콘텐츠가 없습니다</h2>
      <p>다른 필터를 선택해 주세요.</p>
    </article>
  `;
}

function setupHome() {
  $all("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      $all("[data-filter]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      filter = button.dataset.filter;
      renderHome();
    });
  });

  $("#contentList")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-issue]");
    if (!button) return;
    const item = contents.find((content) => content.id === button.dataset.issue);
    item.reserved += 1;
    saveContents();
    showToast(`${item.name} 대기표를 발급했습니다.`);
    renderHome();
  });

  renderHome();
  setInterval(renderHome, 1000);
}

function setupTicket() {
  const select = $("#ticketContent");
  const issueButton = $("#issueTicket");
  if (!select || !issueButton) return;

  select.innerHTML = contents.map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
  issueButton.addEventListener("click", () => {
    const item = contents.find((content) => content.id === select.value);
    const count = Math.max(1, Number($("#ticketCount").value || 1));
    item.reserved += count;
    saveContents();
    showToast(`${item.name} 대기표 ${count}장을 등록했습니다.`);
  });
}

function renderDetail() {
  const root = $("#detailRoot");
  if (!root) return;

  const id = new URLSearchParams(location.search).get("id") || "vr";
  const item = contents.find((content) => content.id === id) || contents[0];

  root.innerHTML = `
    <section class="detail-visual" style="--scene:${item.scene}"></section>
    <section class="plain-card" style="--accent:${item.accent}">
      <h2>${item.name}</h2>
      <p>${item.desc}</p>
      <p><strong>현재 대기 ${waitingPeople(item)}명 · 예상 ${waitMin(item)}분 · 입장 ${entryTime(item)}</strong></p>
    </section>
    <section class="plain-card">
      <h2>계산 방식</h2>
      <p>대기 인원 = 전체 예약 인원 - 이용 완료 횟수</p>
      <p>예상 대기 시간 = 대기 인원 x 평균 이용 시간</p>
    </section>
    <div class="card-actions" style="padding:12px 0 0">
      <a class="primary" style="--accent:${item.accent}" href="ticket.html">대기표 등록</a>
      <a href="index.html">목록으로</a>
    </div>
  `;
}

function init() {
  setupDrawer();
  const page = document.body.dataset.page;
  if (page === "home") setupHome();
  if (page === "ticket") setupTicket();
  if (page === "detail") {
    renderDetail();
    setInterval(renderDetail, 1000);
  }
}

init();
