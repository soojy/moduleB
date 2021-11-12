const host = 'http://localhost/flightapi/public/api'
const web = 'http://localhost/flightapi/public'

let app = new Vue({
    el: '#app',
    data: {
        page : 'index',
        pops:[],
        forms: {
            searchForm:{
                from: 'Moscow',
                to:'Kazan',
                date1:'2021-01-01',
                date2:'2021-01-03',
                passengers: 1,
            },
            filters: {
                by: 'none',
                time1: '00:00',
                time2: '23:59'
            },
            passengers: [
                {
                    "first_name": 'Ivan',
                    "last_name": 'Ivanov',
                    "birth_date": '2000-01-01',
                    "document_number": '1234567890',
                }

],
            seat:{
                rows:[1,2,3,4,5,6,7,8,9,10,11,12]
            },
            regsiterForm :{
                first_name : '',
                last_name : '',
                phone : '',
                document_number : '',
                password : '',
            },
            loginForm :{
                phone : '',
                password : '',
            }

        },
        booking:{},
        flights: {},
        user: {}
    },
    computed:{
      filteredFlights(){
          if (this.forms.filters.by === 'none'){
              return {
                  to :  this.flights.data.flights_to,
                  back : this.flights.data.flights_back
              }
          }
          if (this.forms.filters.by === 'date'){
              return {
                  to :  this.flights.data.flights_to.filter(item => {
                      iDate = new Date('2020-07-07T' + item.form.time);
                      return iDate >= new Date('2020-07-07T' + this.forms.filters.time1 + ':00') && iDate <= new Date('2020-07-07T' + this.forms.filters.time2 + ':00');
                  }),
                  back : this.flights.data.flights_back.filter(item => {
                      iDate = new Date('2020-07-07T' + item.form.time);
                      return iDate >= new Date('2020-07-07T' + this.forms.filters.time1 + ':00') && iDate <= new Date('2020-07-07T' + this.forms.filters.time2 + ':00');
                  }),
              }
          }

          if (this.forms.filters.by === 'fast'){
              return {
                  to :  this.flights.data.flights_to.sort((a, b)=> {
                      let aTime = a.timeFlyH + a.timeFlyM
                      let bTime = b.timeFlyH + b.timeFlyM
                      return aTime- bTime
                  }),
                  back :  this.flights.data.flights_back.sort((a, b)=> {
                      let aTime = a.timeFlyH + a.timeFlyM
                      let bTime = b.timeFlyH + b.timeFlyM
                      return aTime- bTime
                  }),
              }
          }
          if (this.forms.filters.by === 'cheap'){
              return {
                  to :  this.flights.data.flights_to.sort((a, b)=> {
                      return a.cost- b.cost
                  }),
                  back :  this.flights.data.flights_back.sort((a, b)=> {
                      return a.cost- b.cost
                  }),
              }
          }
      },

        finalCost(){
          return this.flights.selected.to[0].cost * this.forms.passengers.length + (this.forms.searchForm.date2 !== '' ? this.flights.selected.back[0].cost * this.forms.passengers.length : 0)
        }
    },
    methods: {
        setPage(page) {
            this.page = page
        },
        // poisk
        async search() {
            let fromIata,toIata
            await fetch(host + `/airport?query=` + this.forms.searchForm.from)
                .then(res => res.json())
                .then(json => fromIata = json.data.items[0].iata)
            await fetch(host + `/airport?query` + this.forms.searchForm.to)
                .then(res => res.json())
                .then(json => toIata = json.data.items[0].iata)
            await fetch(host + `/flight?from=${fromIata}&to=${toIata}&date1=${this.forms.searchForm.date1}&` +(this.forms.searchForm.date2 !== '' ? `date2=${this.forms.searchForm.date1}` : '')  + `&passengers=${this.forms.searchForm.passengers}`)
                .then(res => res.json())
                .then(json => {
                    json.data.flights_to.forEach((item)=>{
                        item.selected = false
                        item.timeFlyH = Math.abs(new Date('2022-07-17T' + item.to.time).getHours() - new Date('2022-07-17T' + item.form.time).getHours() )
                        item.timeFlyM = Math.abs(new Date('2022-07-17T' + item.to.time).getMinutes() - new Date('2022-07-17T' + item.form.time).getMinutes() )
                    })
                    json.data.flights_back.forEach((item)=>{
                        item.selected = false
                        item.timeFlyH = Math.abs(new Date('2022-07-17T' + item.to.time).getHours() - new Date('2022-07-17T' + item.form.time).getHours() )
                        item.timeFlyM = Math.abs(new Date('2022-07-17T' + item.to.time).getMinutes() - new Date('2022-07-17T' + item.form.time).getMinutes() )
                    })
                    this.flights = json
                    this.setPage('search')
                })

        },
        // bronirovanie
        goBooking() {
            this.flights.selected = {
                to : this.flights.data.flights_to.filter(item => {return item.selected === true}),
                back : this.flights.data.flights_back.length > 0 ?this.flights.data.flights_back.filter(item => {return item.selected === true}) : []
            }
            this.setPage('booking')
        },
        // - passazhir
        delPassenger(index) {
            this.forms.passengers.splice(index-2,1)
        },
        // + passazhir
        addPassenger() {
            this.forms.passengers.push({
                "first_name": '',
                "last_name": '',
                "birth_date": '',
                "document_number": '',
            })
        },
        // podtverdit bron
        async bookingConfirm(){
            let body = {
                "flight_from": {
                    "id": this.flights.selected.to[0].flight_id,
                    "date": this.flights.selected.to[0].to.date,
                },
                'passengers' : this.forms.passengers
            }
            if (this.forms.searchForm.date2 !== '') {
                body.flight_back = {
                    "id": this.flights.selected.back[0].flight_id,
                    "date": this.flights.selected.back[0].to.date,
                }
            }
            await fetch(host + '/booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(res => res.json())
                .then(json => this.booking = json.data)

            this.goBookingManagement()
        },
        // perehod na ypravlenie bronirovaniem
        async goBookingManagement(){
            await fetch(host + '/booking/'+this.booking.code)
                .then(res => res.json())
                .then(json => this.booking = json.data)

            this.setPage('booking_management')
        },
        // vibotr mesta
        goSeat(id,type){
            this.forms.seat.id =  id
            this.forms.seat.type =  type
            this.setPage('seat')
        },
        // push notification
        pop(text){
            let index = this.pops.push(text)

            setTimeout(()=>{this.pops.splice(index -1, 1)},1600 )
        },
        // change seat
        async selectSeat(seat){
            let body = {
                "passenger": this.forms.seat.id,
                "seat": seat,
                "type": this.forms.seat.type,
            }

            await fetch(host + `/booking/${this.booking.code}/seat`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(res => res.status === 200? this.pop('Место успешно выбрано'): this.pop('Место уже занято'))
                .then(json => this.goBookingManagement())

        },
        // registraciya
        async register(){
            await fetch(host + `/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.forms.regsiterForm)
            })
                .then(res => res.status === 204? this.pop('Вы успешно зарегестрировались'): this.pop('Что-то пошло не так'))
                .then(json => this.setPage('login'))

        },
        // vhod
        async login(){
            await fetch(host + `/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.forms.loginForm)
            })
                .then(res => {
                    res.status === 200? this.pop('Вы успешно вошли') : this.pop('Проверьте введеные данные')
                    return res.json()
                })
                .then(json => this.user = json.data)
            this.goProfile()

        },
        // na stranicy lichngo kabineta
        async goProfile(){
            await fetch(web + '/user',{
                headers : {
                     'Authorization': `Bearer ${this.user.token}`
                }
            })
                .then(res => res.json())
                .then(json => this.user.data = json)

            this.setPage('profile')
        },
        // vihod
        logout() {
            this.user = ''
            this.setPage('index')
        }



    }
})