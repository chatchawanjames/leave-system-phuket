// --- jsindex.js ---

document.addEventListener("DOMContentLoaded", function () {
  const appsScriptUrl =
    "https://script.google.com/macros/s/AKfycbyWp9jjic7NWNZAjP1IW53FVnLHV2hhN0etD8UBVwOuUUsXJKpGe2AXKGx-KcYRq3U-/exec";

  const careerData = [
    { typeID: "T001", subtypeID: "ST001", desc: "บริหารวิชาการ" },
    { typeID: "T001", subtypeID: "ST002", desc: "บริหารงบประมาณ" },
    { typeID: "T001", subtypeID: "ST003", desc: "บริหารงานบุคคล" },
    { typeID: "T001", subtypeID: "ST004", desc: "บริหารทั่วไป" },
    { typeID: "T001", subtypeID: "ST005", desc: "บริหารกิจการนักเรียน" },
    { typeID: "T001", subtypeID: "ST006", desc: "บริหารงานแผนงาน" },
    { typeID: "T002", subtypeID: "ST007", desc: "ลูกจ้างเหมาบริการ" },
    { typeID: "T002", subtypeID: "ST008", desc: "ลูกจ้างประจำ" },
    { typeID: "T002", subtypeID: "ST009", desc: "นักศึกษาฝึกสอน" },
  ];

  const signinCard = document.getElementById("signinCard");
  const registerCard = document.getElementById("registerCard");
  const linkToRegister = document.getElementById("linkToRegister");
  const linkToSignin = document.getElementById("linkToSignin");
  const typeSelect = document.getElementById("typeID");
  const subtypeSelect = document.getElementById("subtypeID");
  const registerForm = document.getElementById("registerForm");
  const signinForm = document.getElementById("signinForm");

  const statusModal = document.getElementById("statusModal");
  const modalIcon = document.getElementById("modalIcon");
  const modalTitle = document.getElementById("modalTitle");
  const modalCloseBtn = document.getElementById("modalCloseBtn");

  let onModalCloseCallback = null;
  let loadingOverlay = null;

  function showLoading() {
    loadingOverlay = document.createElement("div");
    loadingOverlay.className = "loading-overlay";
    const spinner = document.createElement("div");
    spinner.className = "spinner";
    loadingOverlay.appendChild(spinner);
    document.body.appendChild(loadingOverlay);
  }

  function hideLoading() {
    if (loadingOverlay) {
      loadingOverlay.remove();
      loadingOverlay = null;
    }
  }

  function showModal(text, isSuccess, callback) {
    modalTitle.textContent = text;
    modalIcon.className = "modal-icon " + (isSuccess ? "success" : "error");
    onModalCloseCallback = callback;
    statusModal.classList.remove("hidden");
  }

  modalCloseBtn.addEventListener("click", () => {
    statusModal.classList.add("hidden");
    if (typeof onModalCloseCallback === "function") {
      onModalCloseCallback();
    }
  });

  linkToRegister.addEventListener("click", () => {
    signinCard.classList.add("hidden");
    registerCard.classList.remove("hidden");
  });

  linkToSignin.addEventListener("click", () => {
    registerCard.classList.add("hidden");
    signinCard.classList.remove("hidden");
  });

  typeSelect.addEventListener("change", function () {
    const selectedType = this.value;
    subtypeSelect.innerHTML =
      '<option value="">-- กรุณาเลือกฝ่าย/แผนก --</option>';

    if (selectedType === "") {
      subtypeSelect.disabled = true;
      return;
    }

    const filtered = careerData.filter((item) => item.typeID === selectedType);
    filtered.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.subtypeID;
      option.textContent = item.desc;
      subtypeSelect.appendChild(option);
    });

    subtypeSelect.disabled = false;
  });

  // 📥 3. Event ตอนกด Sign In (ฉบับอัปเกรดดักเช็กสถานะ Waiting / Approve / Block)
  signinForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value;

    showLoading();

    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify({
        action: "signin",
        Email: email,
        Password: password,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        hideLoading();

        if (res.status === "success") {
          const userStatus = res.user.status
            ? res.user.status.toString().trim().toLowerCase()
            : "";

          // 🛑 ด่านที่ 1: เช็กสถานะถ้าเป็น waiting
          if (userStatus === "waiting") {
            showModal(
              "บัญชีของคุณยังไม่ได้ approve กรุณาติดต่อ admin",
              false,
              null,
            );
            return;
          }

          // 🛑 ด่านที่ 2: เช็กสถานะถ้าเป็น block
          if (userStatus === "block") {
            showModal(
              "บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อ admin",
              false,
              null,
            );
            return;
          }

          // 🟢 ด่านที่ 3: ถ้าเป็น approve (หรือสถานะผ่านสิทธิ์อื่นๆ) ผ่านเข้าหน้า main ปกติ
          if (userStatus === "approve") {
            sessionStorage.setItem("userData", JSON.stringify(res.user));
            window.location.href = "main.html";
          } else {
            // ดักเคสเผื่อพิมพ์สถานะแปลกๆ ในชีทแล้วไม่ตรงเงื่อนไขข้างบน
            showModal("สถานะบัญชีไม่ถูกต้อง กรุณาติดต่อ admin", false, null);
          }
        } else {
          showModal(res.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง", false, null);
        }
      })
      .catch((error) => {
        hideLoading();
        console.error("Error:", error);
        showModal("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ", false, null);
      });
  });

  // 📥 4. Event ตอนกด Register (อัปเกรดดักรับแจ้งเตือนเมื่อเกิดกรณีอีเมลซ้ำ)
  registerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const submitBtn = registerForm.querySelector(".btn-submit");
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = "กำลังส่งข้อมูล...";
    submitBtn.disabled = true;

    showLoading();

    const formData = {
      action: "register",
      Prename: document.getElementById("prename").value.trim(),
      Firstname: document.getElementById("firstname").value.trim(),
      Lastname: document.getElementById("lastname").value.trim(),
      Phone: document.getElementById("phone").value.trim(),
      Email: document.getElementById("email").value.trim(),
      Password: document.getElementById("password").value,
      TypeID: typeSelect.value,
      SubtypeID: subtypeSelect.value,
    };

    fetch(appsScriptUrl, {
      method: "POST",
      body: JSON.stringify(formData),
    })
      .then((response) => response.json()) // เปลี่ยนมาดึงค่า JSON เต็มรูปแบบเพื่อแยกประเภทความสำเร็จ
      .then((res) => {
        hideLoading();

        if (res.status === "success") {
          // 🟢 เคสสมัครผ่านฉลุย
          showModal("สมัครสมาชิกเรียบร้อย", true, () => {
            registerForm.reset();
            subtypeSelect.disabled = true;
            registerCard.classList.add("hidden");
            signinCard.classList.remove("hidden");
          });
        } else if (res.status === "duplicate") {
          // 🟡 เคสอีเมลซ้ำ: เปิด Modal สีแดงกากบาท พร้อมข้อความแจ้งจากกหลังบ้าน
          showModal(res.message, false, null);
        } else {
          showModal("สมัครสมาชิกไม่สำเร็จ กรุณาติดต่อ Admin", false, null);
        }
      })
      .catch((error) => {
        hideLoading();
        console.error("Error:", error);
        showModal("สมัครสมาชิกไม่สำเร็จ กรุณาติดต่อ Admin", false, null);
      })
      .finally(() => {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      });
  });
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
