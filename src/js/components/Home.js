/* global Flickity */
import { select } from '../settings.js';

class Home {
    constructor(element) {
        const thisHome = this;

        thisHome.render(element);
        thisHome.initWidgets();

    }

    render(element) {
        const thisHome = this;

        thisHome.dom = {};
        thisHome.dom.wrapper = element;

        thisHome.dom.carousel = thisHome.dom.wrapper.querySelector(select.home.carousel);
        thisHome.dom.orderBox = thisHome.dom.wrapper.querySelector(select.home.orderBox);
        thisHome.dom.bookingBox = thisHome.dom.wrapper.querySelector(select.home.bookingBox);

    }

    initWidgets() {
        const thisHome = this;

        if(!thisHome.dom.carousel)
            return;

        thisHome.flickity = new Flickity(thisHome.dom.carousel,{
            cellSelector: '.home__slide',
            cellAlign: 'left',
            contain: true,
            wrapAround: true,
            autoPlay: 3000,
            prevNextButtons: false,
            pageDots: true,
        });

        thisHome.dom.orderBox.addEventListener('click', function(){
            window.location.hash = '#/order';
        });

        thisHome.dom.bookingBox.addEventListener('click', function(){
            window.location.hash = '#/booking';
        });
    }

}

export default Home;