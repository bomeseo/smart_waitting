// ---------------------------------------------------------------------------
// 화면 갱신과 사용자 인터랙션 담당
// ---------------------------------------------------------------------------
// 이 파일은 HTML을 생성하지 않습니다.
// 이미 HTML 문서에 있는 data-* 요소의 텍스트와 상태만 갱신합니다.
(function () {
  const core = window.SmartWaitingCore;
  let activeFilter = "all";

  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $all(selector, root = document) {
    return [...root.querySelectorAll(selector)];
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
      button.addEventListener("click", closeDrawer);
    });

    drawer.addEventListener("click", (event) => {
      if (event.target === drawer) closeDrawer();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeDrawer();
    });

    function closeDrawer() {
      drawer.classList.remove("open");
      drawer.setAttribute("aria-hidden", "true");
    }
  }

  function setupHomePage() {
    if (document.body.dataset.page !== "home") return;

    $all("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        $all("[data-filter]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        activeFilter = button.dataset.filter;
        renderHomePage();
      });
    });

    renderHomePage();
    setInterval(renderHomePage, 1000);
  }

  function renderHomePage() {
    const summary = core.summary();
    $("#nowTime").textContent = core.clock(new Date());
    $("#totalWaiting").textContent = summary.totalWaiting;
    $("#avgWait").textContent = `${summary.averageWait}분`;
    $("#fastEntry").textContent = summary.fastEntry;
    core.contents.forEach(updateContentCard);
  }

  function updateContentCard(item) {
    const card = $(`[data-card="${item.id}"]`);
    if (!card) return;

    const minutes = core.waitMinutes(item);
    const shouldShow =
      activeFilter === "all" ||
      (activeFilter === "fast" && minutes <= 15) ||
      (activeFilter === "busy" && minutes >= 40);

    card.hidden = !shouldShow;
    card.style.setProperty("--accent", item.accent);
    $("[data-status]", card).textContent = core.statusText(item);
    $("[data-wait]", card).textContent = minutes;
    $("[data-people]", card).textContent = `대기 ${core.waitingPeople(item)}명`;
    $("[data-average]", card).textContent = `평균 ${item.average}분`;
    $("[data-entry]", card).textContent = `입장 ${core.entryTime(item)}`;
  }

  function setupTicketPage() {
    if (document.body.dataset.page !== "ticket") return;

    $("#issueTicket").addEventListener("click", () => {
      const item = core.findContent($("#ticketContent").value);
      const count = Math.max(1, Number($("#ticketCount").value || 1));

      item.reserved += count;
      showToast(`${item.name} 대기표 ${count}장을 등록했습니다.`);
    });
  }

  function setupDesktopPage() {
    if (document.body.dataset.page !== "desktop") return;

    renderDesktopPage();
    setInterval(renderDesktopPage, 1000);
  }

  function renderDesktopPage() {
    const summary = core.summary();
    $("[data-desktop-waiting]").textContent = summary.totalWaiting;
    $("[data-desktop-average]").textContent = `${summary.averageWait}분`;
    $("[data-desktop-entry]").textContent = summary.fastEntry;
  }

  function init() {
    setupDrawer();
    setupHomePage();
    setupTicketPage();
    setupDesktopPage();
  }

  window.SmartWaitingUI = { init };
})();