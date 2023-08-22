function sendOTPByEmail() {
    const email = document.getElementById("email-verify").value;

    // Make an AJAX POST request to the server for OTP generation and email sending
    fetch("/sendOTPByEmail", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          
        })
        .then((data) => {
          // OTP sent successfully, do something here
          console.log("OTP sent successfully:", data);
        })
        .catch((error) => {
          // Error occurred while sending OTP, handle the error here
          console.error("Error sending OTP:", error);
        });
  }
  

  function sendOTPByPhone() {
    const mobile = document.getElementById("sms-verify").value;

    // Make an AJAX POST request to the server for OTP generation and email sending
    fetch("/sendOTPByPhone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile: mobile }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          
        })
        .then((data) => {
          // OTP sent successfully, do something here
          console.log("OTP sent successfully:", data);
        })
        .catch((error) => {
          // Error occurred while sending OTP, handle the error here
          console.error("Error sending OTP:", error);
        });
  }




const EMAIL_VERIFICATION=document.getElementById("emailVerification");
EMAIL_VERIFICATION.addEventListener("click",sendOTPByEmail);

const SMS_VERIFICATION=document.getElementById("smsVerification");
SMS_VERIFICATION.addEventListener("click",sendOTPByPhone);
