"use strict";

let phoneData
const lang = document.getElementsByTagName("html")[0].getAttribute("lang");

$(document).ready(function () {
  const phoneValidate = (formBlock) => {
    const countries = {
      ru: "ru"
    };

    let allElements = formBlock.getElementsByTagName("*");
    let phoneInput = null;

    //get all inputs/blocks needed
    for (let i = 0; i < allElements.length; i++) {
      allElements[i].classList.contains("tel-input") ? phoneInput = allElements[i] : '';
    }
    const iti = intlTelInput(phoneInput, {
      customPlaceholder: function (selectedCountryPlaceholder, selectedCountryData) {
        return '' + selectedCountryPlaceholder.replace(/[0-9]/g, 'X');
      },
      separateDialCode: true,
      preferredCountries: ['ru', 'ua'],
      initialCountry: "auto",
      geoIpLookup: function (success, failure) {
        $.get("https://ipinfo.io", function () { }, "jsonp").always(function (resp) {
          let countryCode = (resp && resp.country) ? resp.country : countries[lang];
          success(countryCode);
        });
      }
    })
    setTimeout(() => {
      phoneData = iti.getSelectedCountryData()
    }, 1000)
  }

  document.querySelectorAll(".form__block").forEach(item => {
    phoneValidate(item);
  })
});

let isLoading
function Form(bl, lang) {
  this.form = bl;
  this.errors = {
    // list of languages
    ru: {
      err_1: 'Поле не может быть пустым',
      err_2: 'Некорректный формат'
    },
  };
  this.lang = this.errors[lang] ? lang : "ru"; // default lang
  this.inputs = bl.find('input');
  this.success = $('.popup');
  this.btn_close_popup = $('.popup__close-btn');
  this.setEvents();
}

Form.prototype = {
  setEvents: function setEvents() {
    var thas = this;
    var valid = [];
    this.btn_close_popup.on('click', function (e) {
      thas.hidePopup();
    });
    this.success.on("click", function (e) {
      if (!$(".popup__inner").is(e.target) && $(".popup__inner").has(e.target).length === 0) {
        thas.hidePopup();
      }
    });
    this.form.on('submit', function (e) {
      e.preventDefault();
      for (var i = 0; i < thas.inputs.length; i++) {
        var error = void 0;
        error = thas.validateInput(thas.inputs.eq(i));
        if (error) valid.push(error);
      }

      if (valid.length) {
        valid = [];
        return false;
      } else {
        thas.SendData();
      }
    });
    this.inputs.each(function () {
      $(this).on('blur', function (e) {
        if (!$(this).val()) {
          $(this).removeClass('active');
        }

        thas.validateInput($(this));
      });
      $(this).on('focus', function (e) {
        $(this).addClass('active');
        thas.removeError($(this));
      });
      $(this).on('input', function () {
        var name_inp = $(this).attr('name');
        if (name_inp === 'phone') {
          $(this).val($(this).val().replace(/[A-Za-zА-Яа-яЁё]/, '')); //запретить ввод букв в телефон
        }
      });
    });
  },
  validateInput: function validateInput(input) {
    var error = void 0;
    error = this.checkError(input);

    if (error) {
      this.addError(input, error);
      this.removeSuccess(input)
    } else {
      this.removeError(input);
      this.addSuccess(input)
    }

    return error;
  },
  checkError: function checkError(input) {
    var err = this.errors[this.lang];
    var name = input.attr('name'),
      value = input.val();

    if (!value) {
      return err.err_1;
    }

    if (name == "email") {
      var reg = /([\w\.\+]{1,})([^\W])(@)([\w]{1,})(\.[\w]{2,})+$/;
      if (!reg.test(value)) return err.err_2;
    }

    if (name == 'phone') {
      var clearTel = value.replace(/\D/g, "");
      var _reg = /\d{7,15}/;
      if (!_reg.test(clearTel)) return err.err_2;
    }

    return false;
  },
  addError: function addError(input, error) {
    var parent = input.parents('.input__wrapper');
    var bl_err = parent.find('.help-block');
    parent.addClass("has-error");
    if (bl_err) bl_err.text(error);
  },
  addSuccess: function addSuccess(input) {
    var parent = input.parents('.input__wrapper');
    parent.addClass("success");
  },
  removeSuccess: function addSuccess(input) {
    var parent = input.parents('.input__wrapper');
    parent.removeClass("success");
  },
  removeError: function removeError(input) {
    var parent = input.parents('.input__wrapper');
    var bl_err = parent.find('.help-block');
    parent.removeClass("has-error");
    if (bl_err) bl_err.text('');
  },
  SendData: function SendData() {
    if (isLoading) {
      setTimeout(() => {
        isLoading = false
      }, 3000)
      return false
    }
    isLoading = true
    var thas = this;
    thas.form[0][1].value = '+' + phoneData.dialCode + thas.form[0][1].value;
    var form_data = thas.form.serialize();
    for (let i = 0; i < 3; i++){
      thas.form[0][i].value = ''
      thas.form[0][i].closest('.input__wrapper').classList.remove('success')
    }
    $.ajax({
      url: "/", // php file sending data
      type: "POST",
      data: form_data,
      success: function success(response, status) {
        if (status == 200) {
          thas.showSuccess();
        } else if (status == 400) { }
      }
    });
  },
  showSuccess: function showSuccess() {
    this.success.addClass('active');
    this.inputs.val('').removeClass('active');
  },
  hidePopup: function hidePopup() {
    this.success.removeClass('active');
  }
};
$(document).ready(function () {
  var param = (typeof lang === "undefined") ? "ru" : lang
  var form = new Form($('.form__block'), param);
});