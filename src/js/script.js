/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

const select = {
  templateOf: {
    menuProduct: '#template-menu-product',
    cartProduct: '#template-cart-product', 
  },
  containerOf: {
    menu: '#product-list',
    cart: '#cart',
  },
  all: {
    menuProducts: '#product-list > .product',
    menuProductsActive: '#product-list > .product.active',
    formInputs: 'input, select',
  },
  menuProduct: {
    clickable: '.product__header',
    form: '.product__order',
    priceElem: '.product__total-price .price',
    imageWrapper: '.product__images',
    amountWidget: '.widget-amount',
    cartButton: '[href="#add-to-cart"]',
  },
  widgets: {
    amount: {
      input: 'input.amount', 
      linkDecrease: 'a[href="#less"]',
      linkIncrease: 'a[href="#more"]',
    },
  },
  cart: {
    productList: '.cart__order-summary',
    toggleTrigger: '.cart__summary',
    totalNumber: `.cart__total-number`,
    totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
    subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
    deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
    form: '.cart__order',
    formSubmit: '.cart__order [type="submit"]',
    phone: '[name="phone"]',
    address: '[name="address"]',
  },
  cartProduct: {
    amountWidget: '.widget-amount',
    price: '.cart__product-price',
    edit: '[href="#edit"]',
    remove: '[href="#remove"]',
  },
};

const classNames = {
  menuProduct: {
    wrapperActive: 'active',
    imageVisible: 'active',
  },
  cart: {
    wrapperActive: 'active',
  },
};

const settings = {
  amountWidget: {
    defaultValue: 1,
    defaultMin: 1,
    defaultMax: 9,
  }, 
  cart: {
    defaultDeliveryFee: 20,
  },

  db: {
    url: '//localhost:3131',
    products: 'products',
    orders: 'orders',
},
};

const templates = {
  menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
};

  class Product{
    constructor(id, data){
      const thisProduct = this;

      thisProduct.id = id;
      thisProduct.data = data;

      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu(){
        const thisProduct = this;

        const generatedHTML = templates.menuProduct(thisProduct.data);
        thisProduct.element = utils.createDOMFromHTML(generatedHTML);
        const menuContainer = document.querySelector(select.containerOf.menu);
        menuContainer.appendChild(thisProduct.element);
    }

    getElements(){
        const thisProduct = this;

        thisProduct.dom = {};
        
        thisProduct.dom.wrapper = thisProduct.element;
        thisProduct.dom.accordionTrigger = thisProduct.dom.wrapper.querySelector(select.menuProduct.clickable);
        thisProduct.dom.form = thisProduct.dom.wrapper.querySelector(select.menuProduct.form);
        thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
        thisProduct.dom.cartButton = thisProduct.dom.wrapper.querySelector(select.menuProduct.cartButton);
        thisProduct.dom.priceElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.priceElem);
        thisProduct.dom.imageWrapper = thisProduct.dom.wrapper.querySelector(select.menuProduct.imageWrapper);
        thisProduct.dom.amountWidgetElem = thisProduct.dom.wrapper.querySelector(select.menuProduct.amountWidget);
    }
  
    initAccordion(){
      const thisProduct = this;

       thisProduct.dom.accordionTrigger.addEventListener('click', function(event) {
      /*[DONE] prevent default action for event */
        event.preventDefault();
      /* [DONE]find active product (product that has active class) */
        const activeProduct = document.querySelector(select.all.menuProductsActive);
      /* [DONE]if there is active product and it's not thisProduct.element, remove class active from it */
        if (activeProduct && activeProduct !== thisProduct.dom.wrapper){
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
      /* [DONE]toggle active class on thisProduct.element */
        thisProduct.dom.wrapper.classList.toggle(classNames.menuProduct.wrapperActive);
    });

  }

    initOrderForm(){
      const thisProduct = this;
      thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    });

      for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
      thisProduct.processOrder();
     });
  }

      thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }

    processOrder(){
      const thisProduct = this;

  // covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
      const formData = utils.serializeFormToObject(thisProduct.dom.form);

  // set price to default price
      let price = thisProduct.data.price;

  // for every category (param)...
      for(let paramId in thisProduct.data.params) {
    // determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
        const param = thisProduct.data.params[paramId];
        
    // for every option in this category
      for(let optionId in param.options) {
      // determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];

        const optionSelected = formData[paramId] && formData[paramId].includes(optionId)

        if(optionSelected){
          if(!option.default) {
            price += option.price;
          }
        } else {
          if(option.default){
            price -= option.price;
          }
        }

        const optionImage = thisProduct.dom.imageWrapper.querySelector('.' + paramId + '-' + optionId);
        if(optionImage){
          if(optionSelected){
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
        
    }
  }
  /*multiply price by amount*/
      thisProduct.priceSingle = price;
      price *= thisProduct.amountWidget.value;
  // update calculated price in the HTML
      thisProduct.dom.priceElem.innerHTML = price;
  }

    initAmountWidget(){
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
      thisProduct.dom.amountWidgetElem.addEventListener('updated', function() {
        thisProduct.processOrder();
      });
    }

    addToCart(){
      const thisProduct = this;

      app.cart.add(thisProduct.prepareCartProduct() );
    }

    prepareCartProduct(){
      const thisProduct = this;

      const productSummary = {};

      productSummary.id = thisProduct.id;
      productSummary.name = thisProduct.data.name;
      productSummary.amount = thisProduct.amountWidget.value;
      productSummary.priceSingle = thisProduct.priceSingle;
      productSummary.price = parseFloat(thisProduct.dom.priceElem.innerHTML);
      productSummary.params = thisProduct.prepareCartProductParams();

      return productSummary;
    }

    prepareCartProductParams(){
      const thisProduct = this;

      const formData = utils.serializeFormToObject(thisProduct.dom.form);

      const paramsSummary = {};

  // 3. Przejdź przez wszystkie kategorie 
      for(let paramId in thisProduct.data.params) {

    // 3a. Pobierz definicję kategorii
      const param = thisProduct.data.params[paramId];

    // 3b. W obiekcie podsumowania stwórz nową kategorię 
      paramsSummary[paramId] = {
        label: param.label,
        options: {}
       };

    // 4. Pętla po opcjach 
      for(let optionId in param.options) {

      // 4a. Pobierz definicję opcji 
      const option = param.options[optionId];

      // 4b. Sprawdź, czy opcja jest wybrana 
      const optionSelected = formData[paramId] && formData[paramId].includes(optionId);

      // 4c. Jeśli wybrana, dodaj ją do wyników
      if(optionSelected){
        paramsSummary[paramId].options[optionId] = option.label;
      }
    }
  }

      return paramsSummary;
}
}
  class AmountWidget {
    constructor(element){
      const thisWidget = this;

      thisWidget.getElements(element);
      if(thisWidget.input.value){
        thisWidget.setValue(thisWidget.input.value);
      } else {
        thisWidget.setValue(settings.amountWidget.defaultValue);
      }
      thisWidget.initActions();
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value){
      const thisWidget = this;

      const newValue = parseInt(value);
      /* TODO: Add validation*/
      if(thisWidget.value !== newValue 
        && !isNaN(newValue)
        && newValue >= settings.amountWidget.defaultMin
        && newValue <= settings.amountWidget.defaultMax
      ){
        thisWidget.value = newValue;
        thisWidget.announce();
      } 
      thisWidget.input.value = thisWidget.value;
    }

    initActions(){
      const thisWidget = this;

      thisWidget.input.addEventListener('change', function(){
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function(event){
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });

    }

    announce(){
      const thisWidget = this;

      const event = new Event('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element){
      const thisCart = this;

      thisCart.products = [];

      thisCart.getElements(element);
      thisCart.initActions();

    }

    getElements(element){
      const thisCart = this;

      thisCart.dom = {};

      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
      thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
      thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
      thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(select.cart.totalPrice);
      thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
      thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
      thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
      thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    }

    initActions(){
      const thisCart = this;

      thisCart.dom.toggleTrigger.addEventListener('click', function(event){
        event.preventDefault();
        thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
      });

      thisCart.dom.productList.addEventListener('updated', function(){
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function(event){
        event.preventDefault();
        thisCart.remove(event.detail.cartProduct);
      });

      thisCart.dom.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisCart.sendOrder();
      });
    }

    add(menuProduct){
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      thisCart.dom.productList.appendChild(generatedDOM);
      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      thisCart.update();
    }

    update(){
      const thisCart = this;

      const deliveryFee = settings.cart.defaultDeliveryFee;

      let totalNumber = 0;
      let subtotalPrice = 0;

      for(const product of thisCart.products){
        totalNumber += product.amount;
        subtotalPrice += product.price;
      }

        thisCart.totalNumber = totalNumber;
        thisCart.subtotalPrice = subtotalPrice;
        thisCart.deliveryFee = totalNumber > 0 ? deliveryFee : 0;
        thisCart.dom.totalNumber.innerHTML = totalNumber;
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;

        if(totalNumber > 0){
          thisCart.totalPrice = subtotalPrice + deliveryFee;
          thisCart.dom.deliveryFee.innerHTML = deliveryFee;
            
          for(const elem of thisCart.dom.totalPrice){
              elem.innerHTML = thisCart.totalPrice;
            }
        } else{
            thisCart.totalPrice = 0;
            thisCart.dom.deliveryFee.innerHTML = 0;

            for(const elem of thisCart.dom.totalPrice){
              elem.innerHTML = 0;
          }
        }
    }

    remove(cartProduct){
      const thisCart = this;

      cartProduct.dom.wrapper.remove();

      const index = thisCart.products.indexOf(cartProduct);
      thisCart.products.splice(index, 1);

      thisCart.update();
    }

    sendOrder(){
      const thisCart = this;

      const url = settings.db.url + '/' + settings.db.orders;

      const payload = {
        address: thisCart.dom.address.value,
        phone: thisCart.dom.phone.value,
        totalPrice: thisCart.totalPrice,
        subtotalPrice: thisCart.subtotalPrice,
        totalNumber: thisCart.totalNumber,
        deliveryFee: thisCart.deliveryFee,
        products: []
      };

      for(let prod of thisCart.products){
        payload.products.push(prod.getData());
      }

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      };

      fetch(url, options);
      console.log('payload:', payload);
    }
  }

  class CartProduct {
    constructor(menuProduct, element){
      const thisCartProduct = this;

      thisCartProduct.getElements(element);

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.amount = menuProduct.amount;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.params = menuProduct.params;

      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();
    }

    getElements(element){
      const thisCartProduct = this;

      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.amountWidget);
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.price);
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.edit);
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(select.cartProduct.remove);
    }

    initAmountWidget(){
      const thisCartProduct = this;

      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);
      thisCartProduct.dom.amountWidget.addEventListener('updated', function(){
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price = thisCartProduct.amount * thisCartProduct.priceSingle;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });

    }

    remove(){
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });

      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions(){
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function(event){
        event.preventDefault();
      });

      thisCartProduct.dom.remove.addEventListener('click', function(event){
        event.preventDefault();
        thisCartProduct.remove();
      });

    }

    getData(){
      const thisCartProduct = this;

      return{
        id: thisCartProduct.id,
        name: thisCartProduct.name,
        amount: thisCartProduct.amount,
        priceSingle: thisCartProduct.priceSingle,
        price: thisCartProduct.price,
        params: thisCartProduct.params,
      };
    }
  }


  const app = {
    initData: function(){
      const thisApp = this;

      thisApp.data = {};
      const url = settings.db.url + '/' + settings.db.products;

      fetch(url)
        .then(function(rawResponse){
          return rawResponse.json();
        })
        .then(function(parsedResponse){
          console.log('parsedResponse:', parsedResponse);

          thisApp.data.products = parsedResponse;

          thisApp.initMenu();
        });
    },

    initMenu: function(){
      const thisApp = this;
      


      for(let productData in thisApp.data.products){
        new Product(thisApp.data.products[productData].id, thisApp.data.products[productData]);
      }
    },

    init: function(){
      const thisApp = this;

      thisApp.initData();
      thisApp.initCart();
    },

    initCart: function(){
      const thisApp = this;

      const cartElem = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElem);
    },
  };
  
  app.init();
}
