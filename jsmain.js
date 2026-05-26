// --- jsmain.js (ฉบับอัปเกรดระบบคุมสิทธิ์คัดกรองเมนูตามบทบาทพนักงาน - อัปเดตสิทธิ์ผู้บริหาร) ---

document.addEventListener("DOMContentLoaded", function () {
  const userFullNameEl = document.getElementById("userFullName");
  const userSubtypeEl = document.getElementById("userSubtype");
  const signOutBtn = document.getElementById("signOutBtn");

  // 📋 ดิกชันนารีสำหรับเทียบหาชื่อฝ่ายงานย่อยจาก SubtypeID
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
  };

  // 🕵️ 1. เช็กความปลอดภัยเบื้องต้น: ดึงข้อมูลความทรงจำผู้ใช้งานจากหน้าล็อกอิน
  const storedUser = sessionStorage.getItem("userData");

  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }

  // แปลงข้อมูลข้อความกลับมาเป็น Object ซอฟต์แวร์
  const user = JSON.parse(storedUser);

  // 📝 หยอดข้อมูลลงหน้าจอจริงบน Navbar ขวาบน
  if (userFullNameEl) {
    userFullNameEl.textContent = `${user.prename} ${user.firstname} ${user.lastname}`;
  }
  if (userSubtypeEl) {
    userSubtypeEl.textContent = careerMap[user.subtypeID] || user.subtypeID;
  }

  // ==========================================================================
  // 🛡️ 🛠️ กลไกจัดสรรสิทธิ์เข้าใช้งานและสับเปลี่ยนการซ่อน/แสดงเมนู (Role-Based Access)
  // ==========================================================================

  // แปลงค่าสิทธิ์พนักงานให้เป็นตัวพิมพ์เล็กทั้งหมดเพื่อป้องกันจุดเพี้ยนของดาต้า
  const currentRole = user.role ? user.role.toLowerCase().trim() : "user";
  const currentSubtype = user.subtypeID
    ? user.subtypeID.toUpperCase().trim()
    : "";

  // ผูกการ์ดเมนูแต่ละอันผ่าน ID ที่เราตั้งค่าไว้ใน HTML
  const menuUserMgmt = document.getElementById("menu-usermanagement");
  const menuQuotaProf = document.getElementById("menu-quotaprofiles");
  const menuLeaveReq = document.getElementById("menu-leaverequest");
  const menuLeaveHist = document.getElementById("menu-leavehistory");
  const menuApproveMgmt = document.getElementById("menu-approvemanagement");
  const menuSubMgmt = document.getElementById("menu-substitute_management");

  // 🔴 ด่านที่ 1: คุมสิทธิ์หน้า usermanagement & quotaprofiles (เฉพาะ admin เท่านั้น)
  if (currentRole === "admin") {
    if (menuUserMgmt) menuUserMgmt.style.display = "flex";
    if (menuQuotaProf) menuQuotaProf.style.display = "flex";
  } else {
    if (menuUserMgmt) menuUserMgmt.style.display = "none";
    if (menuQuotaProf) menuQuotaProf.style.display = "none";
  }

  // 🟢 ด่านที่ 2: คุมสิทธิ์หน้า leaverequest & leavehistory
  // เงื่อนไข: ผอ. (director) และ รอง ผอ. (deputydirector) จะไม่เห็นเมนูนี้ นอกนั้นเห็นปกติ
  if (currentRole === "director" || currentRole === "deputydirector") {
    if (menuLeaveReq) menuLeaveReq.style.display = "none";
    if (menuLeaveHist) menuLeaveHist.style.display = "none";
  } else {
    if (menuLeaveReq) menuLeaveReq.style.display = "flex";
    if (menuLeaveHist) menuLeaveHist.style.display = "flex";
  }

  // 🟠 ด่านที่ 3: คุมสิทธิ์หน้า approvemanagement (เฉพาะผู้บริหาร: admin, director, deputydirector)
  const allowedApprovers = ["admin", "director", "deputydirector"];
  if (allowedApprovers.includes(currentRole)) {
    if (menuApproveMgmt) menuApproveMgmt.style.display = "flex";
  } else {
    if (menuApproveMgmt) menuApproveMgmt.style.display = "none";
  }

  // 🔵 ด่านที่ 4: คุมสิทธิ์เคสพิเศษหน้า substitute_management
  // เงื่อนไขเหล็ก: ต้องเป็นสิทธิ์ admin หรือ (ถ้าเป็น user ทั่วไป ต้องมีรหัสฝ่ายงานย่อยเป็น ST001 บริหารวิชาการ เท่านั้น)
  if (
    currentRole === "admin" ||
    (currentRole === "user" && currentSubtype === "ST001")
  ) {
    if (menuSubMgmt) menuSubMgmt.style.display = "flex";
  } else {
    if (menuSubMgmt) menuSubMgmt.style.display = "none";
  }

  // ==========================================================================

  // 🚪 Logic ตอนกดปุ่ม Sign Out
  if (signOutBtn) {
    signOutBtn.addEventListener("click", function () {
      // console.log("User กดปุ่ม Sign Out ออกจากระบบ");
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
