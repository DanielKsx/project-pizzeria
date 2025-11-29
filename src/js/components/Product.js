  import {select, classNames, templates} from '../settings.js';
  import utils from '../utils.js';
  import AmountWidget from './AmountWidget.js';

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

      // app.cart.add(thisProduct.prepareCartProduct() );
      const event = new CustomEvent('add-to-cart', {
        bubbles: true,
        detail: {
          product: thisProduct.prepareCartProduct(),
        },
      });
      thisProduct.element.dispatchEvent(event);
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

export default Product;