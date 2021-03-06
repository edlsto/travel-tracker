import $ from 'jquery';
var moment = require('moment');
const flatpickr = require("flatpickr");
import DataRepo from './DataRepo';

let domUpdates = {

  calculateDuration(begin, end) {
    const beginDate = moment(begin);
    const endDate = moment(end);
    const duration = endDate.diff(beginDate, 'days')
    return duration
  },

  launchBookTripsView(data, user) {
    const parentContainer = $('main')
    let results;
    this.bookTrip(data.allDestinations)
    const tiles = $('.destination-tile');
    tiles.on('click', (event) => {
      results = this.getDetailsFromDOM(data, event)
    })
    parentContainer.on('click', (event) => {
      console.log(results)
      if ($(event.target).hasClass('submit-request')) {
        let numTravelers = parseInt($('.num-travelers-input').val())
        let duration = this.calculateDuration(results[1].selectedDates[0], results[1].selectedDates[1])
        user.requestTrip(Date.now(), results[0].id, numTravelers, moment(results[1].selectedDates[0]).format('YYYY/MM/DD'), duration)
          .then(
            response => {
              this.reloadUserView(user.id)

            }
          )
      }
  })
},

  reloadUserView(userID) {
    domUpdates.addUserHTML()
    this.addUserDashboardHTML()
    let userData = new DataRepo(userID)
    userData.getUser()
      .then(user => {
        domUpdates.clickLogoReturnHomeUser(user)
        domUpdates.displayName(user.name)
        domUpdates.displaySpentThisYear(Math.round(user.getCostOfTripsThisYear()))
        domUpdates.displayPendingUpcoming(user.getPendingTrips().concat(user.getUpcomingTrips()))
        this.showAlert()
        domUpdates.displayPast(user.getPastTrips())
        domUpdates.displayCurrent(user.getCurrentTrips())
        const bookTrip = $('.book-trip')
        bookTrip.on('click', () => {
          userData.getDestinations()
            .then(data => {
              domUpdates.launchBookTripsView(data, user)
            })
        })
      })
      .catch(error => console.log(error.message))
  },

  validateForm() {
      const userName = $('.user-name')
      const password = $('.password')
      const regex = /^traveler([1-9]|[1-4][0-9]|50)$/;
      if (regex.test(userName.val()) && password.val() === 'travel2020') {
        const userID = parseInt(userName.val().replace( /^\D+/g, ''))
        return userID;
      } else if (userName.val() === 'agency' && password.val() === 'travel2020') {
        return 0;
      } else {
        $('.login-alert').html('<i class="fa fa-exclamation-triangle"></i> Incorrect user name and/or password')
      }
    },

  clickLogoReturnHomeAgency(agency) {
    const mainLogo = $('.main-logo');
    mainLogo.on('click', () => {
      this.returnHomeAgency(agency);
      this.searchForUser(agency);
    })
  },

  loadUserProfile(user, agency) {
    agency.accessUserInfo(user)
    this.setUpUserProfile(agency)
    const pendingUpcomingTrips = agency.getUpcomingTrips().concat(agency.getPendingTrips()).sort((a, b) => {
      return moment(a.date) - moment(b.date)
    })
    this.showUserProfileTrips(pendingUpcomingTrips)
    this.listenForApproveTrip(agency)
    this.listenForDenyTrip(agency)
  },

  showSearchResults(agency) {
    let searchResults = this.searchByName(agency)
    this.displaySearchResults(searchResults)
    const searchResultsCards = $('.search-results-card')
    searchResultsCards.on('click', event => {
      let user = agency.users.find(user => user.id === parseInt($(event.target).parent()[0].id.split('-')[2]))
      this.loadUserProfile(user, agency);
      this.listenForClose(agency)
      this.clickLogoReturnHomeAgency(agency)
    })
  },

  listenForClose(agency) {
    $('.close-btn').on('click', () => {
      agency.resetUserAccess();
      this.returnHomeAgency(agency);
      this.searchForUser(agency);
    })
  },

  searchForUser(agency) {
    const search = $('.search');
    search.on('keyup', () => {
      if (search.val() === '') {
        this.agencyDisplayPending(agency.getAllPendingTrips(agency.getAllTrips()))
        this.approveOrDeny(agency);

      } else {
        this.showSearchResults(agency)
      }
    })
  },


  listenForDenyTrip(agency) {
    const deleteBtn = $('.delete-btn')
    deleteBtn.on('click', event => {
      agency.denyTrip(parseInt($(event.target).parent().parent()[0].id.split('-')[2]))
      .then(
        res => {
          let userData = new DataRepo();
          userData.getAgency()
            .then(newAgency => {
              let newUserData = newAgency.users.find(user => {
                return user.id === agency.id
              })
              this.loadUserProfile(newUserData, newAgency)
              agency = newAgency
              this.listenForClose(agency)
              this.clickLogoReturnHomeAgency(agency)
            })
            .catch(error => console.log(error.message))
        }
      )
      // $(event.target).parent().parent()[0].remove();
    })
  },

  listenForApproveTrip(agency) {
    const approveBtn = $('.approve-btn')
    approveBtn.on('click', event => {
      agency.approveTrip(parseInt($(event.target).parent().parent()[0].id.split('-')[2]))
      .then(
        res => {
          let userData = new DataRepo();
          userData.getAgency()
            .then(newAgency => {
              let newUserData = newAgency.users.find(user => {
                return user.id === agency.id
              })
              this.loadUserProfile(newUserData, newAgency)
              agency = newAgency
              this.listenForClose(agency)
              this.clickLogoReturnHomeAgency(agency)
            })
            .catch(error => console.log(error.message))
        }
      )

    })
  },

  showAlert() {
    const pendingUpcoming = $('.pending-upcoming')
    pendingUpcoming.prepend('<div class="alert">Trip successfully requested! We will review your trip request.</div>')
  },

  clickLogoReturnHomeUser(user) {
    const mainLogo = $('.main-logo');
    mainLogo.on('click', () => {
      this.returnHomeUser(user);
    })
  },



  returnHomeUser(user) {
    const main = $('main')
    main.removeClass('book-trip-view')
    this.addUserDashboardHTML()
    this.displayPendingUpcoming(user.getPendingTrips().concat(user.getUpcomingTrips()))
    this.displayPast(user.getPastTrips())
    this.displayCurrent(user.getCurrentTrips())
  },

  returnHomeAgency(agency) {
    const main = $('main')
    const search = $('.search')
    main.html('<div class="requests"></div>')
    search.val('')
    this.showEarned(agency.getRevenueFromAllNonPendingTripsThisYear(agency.getAllTrips()))
    this.displayCurrentTravelers(agency.getCurrentTrips(agency.getAllTrips()).length)
    this.agencyDisplayPending(agency.getAllPendingTrips(agency.getAllTrips()))
    this.approveOrDeny(agency);
  },

  addUserHTML() {
    const body = $('body')
    body.removeClass('log-in')
    body.html(`
      <header><h2 class="main-logo">Travel Tracker</h2><h3 id="user-name-desktop"></h3><h3 id="user-name-mobile"></h3></header>
      <aside>
        <div class="spent-container"><span id="spent-this-year" class="display-cost"></span>spent on trips this year</div>
        <div class="book-trip">
          <img class="book-icon" alt="icon of a book" src="./images/book.png">
          <h3>Book a trip</h3>
        </div>
      </aside>
      <main>

      </main>
    `);
    body.addClass('dashboard')
    body.removeClass('log-in-screen')
  },

  addUserDashboardHTML() {
    const main = $('main')
    main.html(`
        <div class="current"></div>
        <div class="upcoming-wrapper"><h3>Upcoming trips</h3><div class="pending-upcoming"></div></div>
        <div class="past-wrapper"><h3>Past trips</h3><div class="past"></div></div>
      `)

  },

  setUpUserProfile(agency) {
    const search = $('.search')
    search.on('keyup', () => {
      if (search.val() === '') {
        agency.resetUserAccess();
        this.returnHomeAgency(agency);
        this.searchForUser(agency);

      }
    })
    const requests = $('.requests')
    requests.addClass('user-profile')
    requests.removeClass('requests')
    requests.html(`
      <div class="close-btn-container"><img class="close-btn" alt="icon for close button" src="images/close.png"></div>
      <div class="user-profile-name-amount-spent"><h2>${agency.name}</h2><h3>Amount spent this year: $${this.numberWithCommas(Math.round(agency.getCostOfTripsThisYear()))}</h3></div>
        <div class="user-profile-wrapper">


        </div>
      `);

  },

  showUserProfileTrips(trips) {
    const wrapper = $('.user-profile-wrapper');
    wrapper.html('')
    trips.forEach(trip => {
      wrapper.append(`
        <div class="trip-card" id="trip-request-${trip.id}">
          <div class="trip-options">
            <div class="destination trip-req"><p>${trip.destination.destination}</p></div>
            <div class="date trip-req"><p>${moment(trip.date).format('M/D')}-${moment(trip.date).add(trip.duration, 'days').format('M/D/YYYY')}</p></div>
            <div class="travelers trip-req"><p>${trip.travelers} travelers</p></div>
            <div class="status ${trip.status}"><p class="status-btn">${this.uppercase(trip.status)}</p></div>
          </div>
          <div class="agent-options">
            ${trip.status === 'pending' ? '<button class="agency-btn approve-btn" type="button">Approve</button><button class="agency-btn delete-btn deny-btn" type="button">Deny</button>' : '<button class="agency-btn delete-btn" type="button">Delete</button>'}
          </div>
        </div>`)
    })
  },

  approveOrDeny(agency) {
    const approveBtn = $('.approve-btn')
    const denyBtn = $('.deny-btn')
    approveBtn.on('click', (event) => {
      agency.approveTrip(parseInt($(event.target).parent().parent()[0].id.split('-')[2]))
      .then(
        res => {
          let userData = new DataRepo();
          userData.getAgency()
            .then(newAgency => {
              let newUserData = newAgency.users.find(user => {
                return user.id === agency.id
              })
              agency = newAgency
              this.clickLogoReturnHomeAgency(agency)
            })
            .catch(error => console.log(error.message))
        }
      )
      $(event.target).parent().parent()[0].remove();
    })
    denyBtn.on('click', event => {
      agency.denyTrip(parseInt($(event.target).parent().parent()[0].id.split('-')[2]))
      .then(
        res => {
          let userData = new DataRepo();
          userData.getAgency()
            .then(newAgency => {
              let newUserData = newAgency.users.find(user => {
                return user.id === agency.id
              })
              agency = newAgency
              this.clickLogoReturnHomeAgency(agency)
            })
            .catch(error => console.log(error.message))
        }
      )
      $(event.target).parent().parent()[0].remove();
    })
  },

  addAgencyHTML() {
    const body = $('body')
    body.removeClass('log-in')
    body.html(`
      <header>
        <h2 class="main-logo">Travel Tracker</h2>
          <div class="search-user-name-wrapper"><img class="search-img" alt="icon for search bar" src="./images/search.png"><input type="text" class="search" placeholder="Search for clients ">
        </div>

      </header>
      <aside>
        <div class="spent-container"><span class="display-earned display-cost"></span>in income generated <br> this year</div>
        <div class="spent-container"><span class="display-current-travelers display-cost"></span>travelers on trips today</div>
      </aside>
      <main>
        <div class="requests">
        </div>
      </main>

    `);
    body.addClass('dashboard dashboard-agency')
    body.removeClass('log-in-screen')
  },

  displayName(name) {
    const userNameDesktop = $('#user-name-desktop')
    userNameDesktop.text(name)
    const userNameMobile = $('#user-name-mobile')
    userNameMobile.text(`${name.charAt(0)}${name.split(' ')[1].charAt(0)}`)
  },

  displayCurrentTravelers(num) {
    const displayCurrentTravelers = $('.display-current-travelers')
    displayCurrentTravelers.text(num)
  },

  displaySpentThisYear(amount) {
    const spentThisYear = $('#spent-this-year');
    spentThisYear.text(`$${this.numberWithCommas(amount)}`)
  },

  numberWithCommas(x) {
    x = x.toString();
    var pattern = /(-?\d+)(\d{3})/;
    while (pattern.test(x))
        x = x.replace(pattern, "$1,$2");
    return x;
  },

  displayPendingUpcoming(trips) {
    trips.sort((a, b) => b.status - a.status ? 1 : -1)
    const pendingUpcoming = $('.pending-upcoming')
    trips.forEach(trip => {
      pendingUpcoming.prepend(`<div class="trip-card ${trip.status}"><img class="card-img" alt="${trip.destination.alt}" src=${trip.destination.image}><div class="trip-details"><h3>${trip.destination.destination}</h3><p> ${moment(trip.date).format('M/D')}-${moment(trip.date).add(trip.duration, 'days').format('M/D/YYYY')}</p><p>Travelers: ${trip.travelers}</div><div class="status"><p class="status-btn">${this.uppercase(trip.status)}</p></div></div>`)
    })

  },

  displaySearchResults(users) {
    const requests = $('.requests')
    requests.html('')
    requests.append(users.length > 0 ? '<h3>Search results</h3>' : '<h3>No search results</h3>')
    users.forEach(user => {
      requests.append(`<div class="trip-card search-results-card" id="user-id-${user.id}"><span class="traveler-name search-result">${user.name}</span><button type="button" class="client-details-btn agency-btn">See client details</button></div>`)
    })
  },

  uppercase(string) {
    let stringArray = string.split('');
    stringArray[0] = stringArray[0].toUpperCase();
    return stringArray.join('')
  },

  displayCurrent(trips) {
    const current = $('.current');
    trips.forEach(trip => {
      current.prepend(`<div class="trip-card current-trip"><div class="current-label"><p class="status-btn">Current trip</p></div><div class="trip-details"><h3>${trip.destination.destination}</h3><p> ${moment(trip.date).format('M/D')}-${moment(trip.date).add(trip.duration, 'days').format('M/D/YYYY')}</p><p>Travelers: ${trip.travelers}</div><img class="card-img" alt="${trip.destination.alt}" src=${trip.destination.image}></div>`)
    })
  },

  displayPast(trips) {
    const past = $('.past')
    trips.forEach(trip => {
       past.prepend(`<div class="trip-card"><img class="card-img" src=${trip.destination.image} alt="${trip.destination.alt}"><div class="trip-details"><h3>${trip.destination.destination.split(', ')[0]}</h3><p> ${moment(trip.date).format('M/D')}-${moment(trip.date).add(trip.duration, 'days').format('M/D/YYYY')}</p></div></div>`)
     })
  },


  agencyDisplayPending(trips) {
    const requests = $('.requests')
    requests.html('')
    requests.append(trips.length > 0 ? '<h3>Pending trip requests</h3>' : '<h3>No new trip requests</h3>')
    trips.forEach(trip => {
      requests.append(`<div class="trip-card" id="trip-request-${trip.id}""><div class="trip-details"><span class="traveler-name trip-req">${trip.name}</span><span class="destination trip-req">${trip.destination.destination}</span><span class="date trip-req">${moment(trip.date).format('M/D')}-${moment(trip.date).add(trip.duration, 'days').format('M/D/YYYY')}</span><span class="travelers trip-req">${trip.travelers} travelers</span></div><div class="approve-deny-btns"><button class="agency-btn approve-btn" type="button">Approve</button><button class="agency-btn deny-btn" type="button">Deny</button></div></div>`)
    })

  },


  createTiles(destinations) {
    const destinationsWrapper = $('.destinations-wrapper');
    destinations.forEach(destination => {
      destinationsWrapper.append(`<div class="destination-tile" id="${destination.id}"><div class="destination-name-wrapper"><span class="destination-name">${destination.destination}</span></div><img src=${destination.image} alt="${destination.alt}"></div>`)
    })

  },

  bookTrip(destinations) {
    const main = $('main')
    main.html('');
    main.addClass('book-trip-view')
    main.append('<div><h3>Where do you want to go?</h3></div><div class="destinations-wrapper"></div>')
    this.createTiles(destinations);


  },

  selectDestination(event, destinations) {
    const main = $('main')
    main.addClass('select-trip-details')
    let selectedDestination = destinations.find(destination => destination.id === parseInt($(event.target).closest('.destination-tile')[0].id));
    return selectedDestination
  },

  selectTripDetails(selectedDestination) {
    const main = $('main')
    main.addClass('select-trip-details')
    main.html(
      `<h3>So you wanna go to ${selectedDestination.destination} ...</h3>
      <div id="date-picker"></div>
      <div class="lower-wrapper">
      <div class="options-wrapper">
      <h4>Number of travelers</h4>
      <div class="number-travelers-wrapper"><img class='plus-minus-img minus' alt="image of plus" src='./images/minus.png'><input type="number" value=2 class="num-travelers-input"><img class='plus-minus-img plus' alt="image of minus" src='./images/plus.png'></div>
      <button class="submit-request">Submit request</button>
      </div>
      <div class="calculate-cost">
      <h4>The estimated cost of this trip is</h4>
      <div class="display-cost" id="cost-estimate">—</div>
      </div>
      </div>`
    )
  },


  getTravelersNumber(selectedDestination, fp) {
    this.showCost(selectedDestination, fp.selectedDates, $('.num-travelers-input').val())
    const numTravelersInput = $('.num-travelers-input')
    $('.minus').on('click', () => {
      let travelers = numTravelersInput.val();
      travelers--;
      numTravelersInput.val(travelers)
    })
    $('.plus').on('click', () => {
      let travelers = numTravelersInput.val();
      travelers++;
      numTravelersInput.val(travelers)
    })
    $('.plus-minus-img').on('click', () => {
      this.showCost(selectedDestination, fp.selectedDates, $('.num-travelers-input').val())
    })
    return parseInt($('.num-travelers-input').val())
  },

  showEarned(amount) {
    const displayEarned = $('.display-earned');
    displayEarned.text(`$${this.numberWithCommas(amount.toFixed(2))}`)
  },

  showCost(destination, selectedDates, travelers) {
    const beginDate = moment(selectedDates[0]);
    const endDate = moment(selectedDates[1]);
    const duration = endDate.diff(beginDate, 'days')
    const totalCostPerTraveler = (duration * destination.estimatedLodgingCostPerDay + destination.estimatedFlightCostPerPerson) * 1.1;
    const totalCost = totalCostPerTraveler * travelers;
    $('#cost-estimate').text(`$${this.numberWithCommas(Math.round(totalCost))}`)
  },

  getDates(selectedDestination) {
    let fp = flatpickr("#date-picker", {
      mode: 'range',
      inline: 'true',
      showMonths: window.innerWidth > 1000 ? 2 : 1,
      minDate: new Date().fp_incr(1),
      defaultDate: [moment().add(14,'days').format('YYYY-MM-DD'), moment().add(21,'days').format('YYYY-MM-DD')],
      onChange: function(selectedDates, dateStr, instance) {
        if (selectedDates.length === 2) {
          domUpdates.showCost(selectedDestination, selectedDates, $('.num-travelers-input').val())
        }
      }
    });
    return fp;
  },

  searchByName(agency) {
    const search = $('.search');
    return agency.users.filter(user => {
      return search.val().toLowerCase() === user.name.slice(0, search.val().length).toLowerCase() || search.val().toLowerCase() === user.name.split(' ')[1].slice(0, search.val().length).toLowerCase()
    })
  },


  getDetailsFromDOM(data, event) {
    let selectedDestination = this.selectDestination(event, data.allDestinations)
    this.selectTripDetails(selectedDestination);
    let fp = this.getDates(selectedDestination)
    this.getTravelersNumber(selectedDestination, fp)
    return [selectedDestination, fp]
  }


}


export default domUpdates;
