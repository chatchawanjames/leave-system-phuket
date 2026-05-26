// --- jsleavehistory.js (ฉบับอัปเกรดระบบค้นหาแบบเจาะจงช่วงเวลาเต็มระบบ) ---

document.addEventListener("DOMContentLoaded", function () {
  // 🟢 URL หลังบ้าน Google Apps Script ของพี่เจมส์
  const appsScriptUrl =
    "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

  // 🔒 1. ตรวจสอบความปลอดภัยดัก Passport ประจำตัวผู้ใช้
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }
  const currentUser = JSON.parse(storedUser);

  // ผูก Elements หน้าบ้าน
  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const historyTableBody = document.getElementById("historyTableBody");

  // ผูกเพิ่มตัวแปรกล่องควบคุมเงื่อนไข และสถานะการซ่อน/โชว์ตาราง
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");
  const filterStatusSelect = document.getElementById("filterStatus");
  const searchBtn = document.getElementById("searchBtn");

  const careerMap = {
    ST001: "บริหารวิชาการ",
    ST002: "บริหารงบประมาณ",
    ST003: "บริหารงานบุคคล",
    ST004: "บริหารทั่วไป",
    ST005: "บริหารกิจการนักเรียน",
    ST006: "บริหารงานแผนงาน",
    ST007: "ลูกจ้างเหมาบริการ",
    ST008: "ลูกจ้างประจำ",
    ST009: "นักศึกษาฝึกสอน",
    T001: "คุณครู (Teacher)",
    T002: "ลูกจ้าง (Employee)",
  };

  if (userFullNameEl)
    userFullNameEl.textContent = `${currentUser.prename} ${currentUser.firstname} ${currentUser.lastname}`;
  if (userSubtypeEl)
    userSubtypeEl.textContent =
      careerMap[currentUser.subtypeID] || currentUser.subtypeID;

  // 🟢 ตั้งค่าเริ่มต้นให้ปฏิทินสิ้นสุด (endDate) เป็นวันปัจจุบัน
  if (endDateInput) {
    endDateInput.value = new Date().toISOString().split("T")[0];
  }

  // 🟢 ผูกเหตุการณ์คลิกเข้ากับปุ่มค้นหาข้อมูล (ออนดีมานด์เซฟแรงเครื่อง)
  if (searchBtn) {
    searchBtn.addEventListener("click", fetchPersonalLeaveHistory);
  }

  // ==========================================
  // 🛡️ ฟังก์ชันช่างตัดแต่งจัดการฟอร์แมตวันที่ให้อ่านง่ายสากล (คงสเปกดั้งเดิมไว้)
  // ==========================================
  function cleanAndFormatDate(rawDateStr, includeTime = false) {
    if (!rawDateStr) return "-";

    try {
      let cleanStr = rawDateStr.toString();
      if (cleanStr.includes("T")) {
        cleanStr = cleanStr.split("T")[0];
      }

      if (cleanStr.includes("/") && !includeTime) {
        return cleanStr;
      }

      const d = new Date(rawDateStr);
      if (isNaN(d.getTime())) return rawDateStr;

      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();

      if (includeTime) {
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }

      return `${day}/${month}/${year}`;
    } catch (e) {
      return rawDateStr;
    }
  }

  // 📡 2. ฟังก์ชันหลัก: ดึงข้อมูลประวัติการลาแบบระบุเงื่อนไขตัวกรองตรงจากคลาวด์
  function fetchPersonalLeaveHistory() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const selectedStatus = filterStatusSelect.value;

    // 🚨 Validation ตรวจสอบเงื่อนไขวันที่เบื้องต้น
    if (!startDate || !endDate) {
      alert(
        "❌ กรุณาเลือกช่วงวันที่ (เริ่มวันที่ยื่น - ถึงวันที่) ให้ครบถ้วนก่อนค้นหาครับ",
      );
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert(
        "❌ วันที่เริ่มต้น ต้องไม่เกิน วันที่สิ้นสุด กรุณาตรวจสอบอีกครั้งครับ",
      );
      return;
    }

    if (loadingOverlay) loadingOverlay.classList.remove("hidden");

    // เปลี่ยนผ่านสถานะตาราง สั่งปิดหน้าจอระหว่างรอโหลดข้อมูลใหม่
    if (tableContainer) tableContainer.style.display = "none";
    if (emptyState) emptyState.style.display = "none";
    historyTableBody.innerHTML = "";

    // 🎯 🟢 ผูกพ่วงตัวแปร 4 เงื่อนไข (userID, startDate, endDate, status) ยิงทะลวงท่อแบบ GET
    const fetchUrl = `${appsScriptUrl}?action=getPersonalLeaveHistory&userID=${currentUser.userID}&startDate=${startDate}&endDate=${endDate}&status=${selectedStatus}`;

    fetch(fetchUrl)
      .then((response) => response.json())
      .then((res) => {
        if (loadingOverlay) loadingOverlay.classList.add("hidden");

        if (res.status === "success") {
          // ส่งดาต้าก้อนคัดหัวกะทิไปพ่นเรนเดอร์ในตาราง HTML
          renderTableData(res.data);
        } else {
          historyTableBody.innerHTML = `<tr><td colspan="15" style="text-align:center; color:red;">เกิดข้อผิดพลาดในการโหลดประวัติ: ${res.message}</td></tr>`;
          if (tableContainer) tableContainer.style.display = "block";
        }
      })
      .catch((err) => {
        if (loadingOverlay) loadingOverlay.classList.add("hidden");
        console.error("Fetch history fail:", err);
        historyTableBody.innerHTML =
          '<tr><td colspan="15" style="text-align:center; color:red;">การเชื่อมต่อล้มเหลว กรุณาลองใหม่อีกครั้ง</td></tr>';
        if (tableContainer) tableContainer.style.display = "block";
      });
  }

  // 📊 3. ฟังก์ชันจัดเรียงพ่นข้อมูล (Loop Render HTML) ลงตาราง
  function renderTableData(recordsList) {
    historyTableBody.innerHTML = "";

    if (!recordsList || recordsList.length === 0) {
      // ค้นหาแล้วไม่เจอประวัติ สลับไปโชว์ข้อความแจ้งเตือนกล่องว่าง
      if (emptyState) {
        emptyState.querySelector("p").innerText =
          "📭 ไม่พบประวัติข้อมูลการลางานที่ตรงกับเงื่อนไขในช่วงเวลาดังกล่าว";
        emptyState.style.display = "block";
      }
      return;
    }

    recordsList.forEach((item) => {
      const tr = document.createElement("tr");

      let statusBadge = `<span class="badge waiting">รออนุมัติ</span>`;
      if (item.status === "approved")
        statusBadge = `<span class="badge approved">อนุมัติแล้ว</span>`;
      if (item.status === "rejected")
        statusBadge = `<span class="badge rejected">ไม่อนุมัติ</span>`;

      const fullNameText = `${currentUser.prename} ${currentUser.firstname} ${currentUser.lastname}`;
      const typeText = careerMap[currentUser.typeID] || currentUser.typeID;
      const subtypeText =
        careerMap[currentUser.subtypeID] || currentUser.subtypeID;

      // จัดฟอร์แมตความงามของวันที่ในแต่ละช่องแถว
      const formattedStartDate = cleanAndFormatDate(item.start_date, false);
      const formattedEndDate = cleanAndFormatDate(item.end_date, false);
      const formattedRequestDate = cleanAndFormatDate(item.request_date, true);
      const formattedActionDate = cleanAndFormatDate(item.action_date, true);

      tr.innerHTML = `
        <td><b>${item.leave_id}</b></td>
        <td>${fullNameText}</td>
        <td>${typeText}</td>
        <td>${subtypeText}</td>
        <td>${item.leave_type}</td>
        <td style="white-space: normal; max-width: 250px;">${item.reason || "-"}</td>
        <td>${formattedStartDate}</td>
        <td>${formattedEndDate}</td>
        <td><span style="font-weight:600; color:#7c3aed;">${item.total_days}</span> วัน</td>
        <td>${item.has_substitute === "Y" ? "ต้องการ" : "ไม่ต้องการ"}</td>
        <td>${item.substitute_id || "-"}</td>
        <td>${statusBadge}</td>
        <td>${formattedRequestDate}</td>
        <td>${item.action_by || "-"}</td> 
        <td>${formattedActionDate}</td> 
      `;
      historyTableBody.appendChild(tr);
    });

    // เรนเดอร์ครบถ้วน สั่งกางแสดงตัวบล็อกตารางขึ้นมาทันที
    if (tableContainer) tableContainer.style.display = "block";
  }

  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      sessionStorage.removeItem("userData");
      window.location.href = "index.html";
    });
  }
});

// ==========================================================================
// 🛡️ ระบบรักษาความปลอดภัยกลาง: CHECK SESSION TIMEOUT (10 นาทีอัตโนมัติ)
// ==========================================================================
(function checkSystemSessionTimeout() {
  const storedUser = sessionStorage.getItem("userData");
  if (!storedUser) return; // ถ้าไม่ได้ล็อกอินปล่อยให้ลอจิกหลักจัดการดีดออก

  const user = JSON.parse(storedUser);
  if (!user.sessionTimeout) return;

  // 🔄 ฟังก์ชันย่อยสำหรับแปลง String "d/M/yyyy, HH:mm:ss" ให้เป็น Date Object ของ JavaScript
  function parseDateTimeStr(str) {
    try {
      // แยกส่วนระหว่าง วันที่ กับ เวลา ด้วย ", "
      const parts = str.split(", ");
      if (parts.length !== 2) return new Date(str);

      const dateParts = parts[0].split("/"); // [d, M, yyyy]
      const timeParts = parts[1].split(":"); // [HH, mm, ss]

      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // เดือนใน JS เริ่มนับจาก 0
      const year = parseInt(dateParts[2], 10);

      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      const seconds = parseInt(timeParts[2], 10);

      return new Date(year, month, day, hours, minutes, seconds);
    } catch (e) {
      console.error("Format parse error:", e);
      return new Date(str);
    }
  }

  // ⏰ ตั้งเวลาจับตาดูทุก ๆ 1 วินาที (1000ms) แบบ Real-time
  const sessionInterval = setInterval(function () {
    const now = new Date();
    const expireTime = parseDateTimeStr(user.sessionTimeout);

    // 🚨 ดักจับ: ถ้าเวลาปัจจุบันวิ่งเลยเวลาหมดอายุในระบบ
    if (now.getTime() > expireTime.getTime()) {
      clearInterval(sessionInterval); // สั่งหยุดตัวนับเวลาชั่วคราว

      // ล้างหน่วยความจำความทรงจำทิ้งทันทีป้องกันการแฮกย้อนกลับ
      sessionStorage.removeItem("userData");

      // 🖼️ สร้างกล่องแจ้งเตือนพรีเมียมเด้งขึ้นมากลางหน้าจอ (งอกโค้ดครอบสดโดยไม่พึ่ง Modal HTML เดิม)
      const timeoutOverlay = document.createElement("div");
      timeoutOverlay.style =
        "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.6); backdrop-filter:blur(5px); display:flex; justify-content:center; align-items:center; z-index:9999; font-family:'Prompt',sans-serif;";

      timeoutOverlay.innerHTML = `
        <div style="background:#ffffff; padding:35px; border-radius:12px; text-align:center; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); max-width:400px; width:90%; animation: slideUp 0.3s ease-out;">
          <div style="font-size:50px; margin-bottom:15px;">⏳</div>
          <h3 style="margin:0 0 10px 0; color:#1e293b; font-size:18px; font-weight:600;">หมดเวลาเข้าใช้งานระบบ</h3>
          <p style="margin:0 0 25px 0; color:#64748b; font-size:14px; line-height:1.5;">เพื่อความปลอดภัยของข้อมูล บัญชีของคุณถูกตัดการเชื่อมโยงเนื่องจากไม่มีการเคลื่อน</p>
          <button id="btnTimeoutRedirect" style="padding:10px 24px; background:#0284c7; color:#ffffff; border:none; border-radius:6px; font-size:14px; font-weight:500; cursor:pointer; width:100%;">เข้าสู่ระบบใหม่อีกครั้ง</button>
        </div>
      `;

      document.body.appendChild(timeoutOverlay);

      // ดักจับคลิกปุ่มตกลงเพื่อพาวาร์ปกลับหน้าล็อกอิน
      document
        .getElementById("btnTimeoutRedirect")
        .addEventListener("click", function () {
          window.location.href = "index.html";
        });

      // ป้องกันเผื่อลืมกด สั่งวาร์ปออโต้ไปหน้าแรกเองภายใน 5 วินาที
      setTimeout(function () {
        window.location.href = "index.html";
      }, 5000);
    }
  }, 1000);
})();
