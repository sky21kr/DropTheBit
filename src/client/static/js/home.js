$(".sign-up").click(() => {
  $(".signup__modal").removeClass("hidden");
});

$(".signup-cancel-btns").click(() => {
  $(".signup__modal").addClass("hidden");
});

// 메인 화면 로그아웃
$(".btn-logout").click(() => {
  location.href = "account/logout";
});

// 메인화면에서 대쉬보드로 이동
$(".btn-goToDashboard").click(() => {
  location.href = "account/login";
});

// 로그인
// $(".login").click(() => {
//   const id = $(".id__input").val();
//   const password = $(".password__input").val();
//   const user = {
//     userId: id,
//     password,
//   };
//   console.log("hi");
//   $.ajax({
//     url: "main",
//     // dataType: "json",
//     type: "POST",
//     data: { user: JSON.stringify(user) },
//     success: function (data) {
//       $("html").html(data);
//       console.log("hello");
//     },
//     error: function () {
//       $(".content").text("There is no matching user information");
//       $(".submit-check__modal").removeClass("hidden");
//       $(".ok-btn").click(() => {
//         $(".submit-check__modal").addClass("hidden");
//       });
//       console.log("no");
//     },
//   });
// });

//회원가입
$(".signup-submit-btns").click(() => {
  const id = $(".signup-input-id").val();
  const nickname = $(".signup-input-nickname").val();
  const password = $(".signup-input-password").val();
  const cpassword = $(".signup-input-cpassword").val();
  const email = $(".signup-input-email").val();
  const user = {
    id: id,
    nickname: nickname,
    email: email,
    password1: password,
    password2: cpassword,
  };
  $.ajax({
    url: "/account/signup/",
    dataType: "json",
    type: "POST",
    data: user,
    success: function () {
      $(".content").text("Sign Up Success");
      $(".submit-check__modal").removeClass("hidden");
      $(".ok-btn").click(() => {
        $(".submit-check__modal").addClass("hidden");
        $(".signup__modal").addClass("hidden");
      });
    },
    error: function () {
      $(".content").text("Confirm password does not match");
      $(".submit-check__modal").removeClass("hidden");
      $(".ok-btn").click(() => {
        $(".submit-check__modal").addClass("hidden");
      });
    },
  });
});
