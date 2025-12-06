import { select, templates, settings, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
    constructor(element){
        const thisBooking = this;

        thisBooking.selectedTable = null;

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData(){
        const thisBooking = this;
        
        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam,
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam,
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam,
            ],
        };

       // console.log('getData params', params);
        const urls = {
            booking:       settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.events   + '?' + params.eventsCurrent.join('&'),
            eventsRepeat:  settings.db.url + '/' + settings.db.events   + '?' + params.eventsRepeat.join('&'),
        };

       // console.log('getData urls', urls);
       Promise.all([
            fetch(urls.booking),
            fetch(urls.eventsCurrent),
            fetch(urls.eventsRepeat),
       ])
       
        .then(function(allResponses){
            const bookingsResponse = allResponses[0];
            const eventsCurrentResponse = allResponses[1];
            const eventsRepeatResponse = allResponses[2];
            return Promise.all([
                bookingsResponse.json(),
                eventsCurrentResponse.json(),
                eventsRepeatResponse.json(),
            ]);

        })
        .then(function([bookings, eventsCurrent, eventsRepeat]){
            // console.log(bookings);
            // console.log(eventsCurrent);
            // console.log(eventsRepeat);
            thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
        });
    }

    parseData(bookings, eventsCurrent, eventsRepeat){
        const thisBooking = this;

        thisBooking.booked = {};

        for(let item of bookings){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        for(let item of eventsCurrent){
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        
        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for(let item of eventsRepeat){
            if(item.repeat == 'daily'){
                for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
                thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }

        // console.log('thisbooking', thisBooking.booked);

        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table){
        const thisBooking = this;

        if(typeof thisBooking.booked[date] == 'undefined'){
            thisBooking.booked[date] = {};
        }

        const startHour = utils.hourToNumber(hour);


        for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock+= 0.5){
            //console.log('loop', hourBlock);

            if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
                thisBooking.booked[date][hourBlock] = [];
        }

        thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM(){
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        thisBooking.resetSelectedTable();

        let allAvailable = false;

        if(
            typeof thisBooking.booked[thisBooking.date] == 'undefined' 
            ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
        ){
            allAvailable = true;
        }

        for(let table of thisBooking.dom.tables){
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if(!isNaN(tableId)){
                tableId = parseInt(tableId);
            }

            if(
                !allAvailable
                &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ){
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    render(element) {
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget();

        thisBooking.dom = {};
        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.message = thisBooking.dom.wrapper.querySelector('.booking-message');
        thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.cart.phone);
        thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.cart.address);
        thisBooking.dom.form = thisBooking.dom.wrapper.querySelector('.booking-form');
    }

    initWidgets(){
        const thisBooking = this;

        thisBooking.peopleAmountWidget = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmountWidget = new AmountWidget(thisBooking.dom.hoursAmount);
        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function(){
            thisBooking.updateDOM();
        });

        thisBooking.dom.wrapper.addEventListener('click', function(event){
            thisBooking.initTables(event);
        });

        thisBooking.dom.form.addEventListener('submit', function(event){
            event.preventDefault();
            thisBooking.sendBooking();
        })
    }

    initTables(event){
        const thisBooking = this;

        const clickedElement = event.target;
        const table = clickedElement.closest(select.booking.tables);

        if(!table){
            return;
        }

        if(table.classList.contains(classNames.booking.tableBooked)){
            thisBooking.showMessage('This table is already booked!');
            return;
        }

        if(table.classList.contains(classNames.booking.tableSelected)){
            table.classList.remove(classNames.booking.tableSelected);
            thisBooking.selectedTable = null;
            return;
        }

        for(let tableElem of thisBooking.dom.tables){
            tableElem.classList.remove(classNames.booking.tableSelected);
        }

        table.classList.add(classNames.booking.tableSelected);
        thisBooking.selectedTable = table.getAttribute(settings.booking.tableIdAttribute);
    }

    resetSelectedTable(){
        const thisBooking = this;
        
        for(let table of thisBooking.dom.tables){
            table.classList.remove(classNames.booking.tableSelected);
        }

            thisBooking.selectedTable = null;
        }

    showMessage(message){
        const thisBooking = this;

        thisBooking.dom.message.innerText = message;

        thisBooking.dom.message.classList.add('visible');

        clearTimeout(thisBooking.messageTimeout);
        thisBooking.messageTimeout = setTimeout(() => { 
            thisBooking.dom.message.classList.remove('visible');
        }, 2000);
    }

    sendBooking(){
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.bookings;

        const payload = {
            date: thisBooking.datePicker.value,
            hour: thisBooking.hourPicker.value,
            table: thisBooking.selectedTable !== null
            ? parseInt(thisBooking.selectedTable) 
            : null,
            duration: thisBooking.hoursAmountWidget.value,
            ppl: thisBooking.peopleAmountWidget.value,
            starters: [],
            phone: thisBooking.dom.phone.value,
            address: thisBooking.dom.address.value,
        };

        const startersInputs = thisBooking.dom.wrapper.querySelectorAll('input[name="starter"]:checked');

        for (let starter of startersInputs){
            payload.starters.push(starter.value);
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        fetch(url, options)
            .then(function(response){
                return response.json();
            })

            .then(function(parsedResponse){
                console.log('booking saved:', parsedResponse);

                if(payload.table !==null){
                    thisBooking.makeBooked(payload.date, payload.hour, payload.duration, payload.table);
                    thisBooking.updateDOM();
                }

                thisBooking.showMessage('Table booked!');
            });

    }
}

export default Booking;