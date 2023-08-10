const TelegramBot = require('node-telegram-bot-api');
const AsciiTable = require('ascii-table');
const fs = require('fs');

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {polling: {interval: 5000}});

const writeBuffer = (data) => {
    const date = new Date()
    const { tempinf, humidityin, tempf, humidity, winddir, windspeedmph, windgustmph, solarradiation, uv, rrain_piezo, drain_piezo, ws90cap_volt, wh90batt, temp1f, humidity1, temp2f, humidity2, temp3f, humidity3 } = data

    fs.writeFileSync('../Buffer/last.json', {
        "Time": date.toDateString(), 
        "Temperature": {
            "Outdoors": tempf,
            "Kitchen": temp1f,
            "LivingRoom": tempinf,
            "Office": temp2f,
            "Bedroom": temp3f
        },
        "Humidity": {
            "Outdoors": humidity,
            "Kitchen": humidity1,
            "LivingRoom": humidityin,
            "Office": humidity2,
            "Bedroom": humidity3
        },
        "WindDirection": winddir,
        "WindSpeed": windspeedmph,
        "WindGust": windgustmph,
        "SolarRadiation": solarradiation,
        "UV": uv,
        "RainRate": rrain_piezo,
        "DailyRain": drain_piezo,
        "CapacitorVoltage": ws90cap_volt,
        "BatteryVoltage": wh90batt
    }, (err) => console.log(err))
}

const generateReport = (options) => {
    let table = new AsciiTable('Weather Report')
    table.setHeading('Metric', 'Location', 'Value')

    data = JSON.parse(fs.readFileSync(__dirname + '/../Buffer/last.json', {encoding: 'utf-8', flag: 'r'}));

    const addTime = () => {
        let date = new Date();
        let currHour = date.getHours()
        let currMin = date.getMinutes()
        table.addRow('Time', `${date.toDateString()}`, `${currHour}:${currMin}`)
    }

    const addTemperature = () => {
        table.addRow('Temperature', 'Outdoors', `${data.Temperature.Outdoors}\xB0F`)
        table.addRow('Temperature', 'Kitchen', `${data.Temperature.Kitchen}\xB0F`)
        table.addRow('Temperature', 'Living Room', `${data.Temperature.LivingRoom}\xB0F`)
        table.addRow('Temperature', 'Office', `${data.Temperature.Office}\xB0F`)
        table.addRow('Temperature', 'Bedroom', `${data.Temperature.Bedroom}\xB0F`) 
    }

    const addHumidity = () => {
        table.addRow('Humidity', 'Outdoors', `${data.Humidity.Outdoors}%`)
        table.addRow('Humidity', 'Kitchen', `${data.Humidity.Kitchen}%`)
        table.addRow('Humidity', 'Living Room', `${data.Humidity.LivingRoom}%`)
        table.addRow('Humidity', 'Office', `${data.Humidity.Office}%`)
        table.addRow('Humidity', 'Bedroom', `${data.Humidity.Bedroom}%`) 
    }

    const addWind = () => {
        table.addRow('Wind Direction', '-', `${data.WindDirection}\xB0`)
        table.addRow('Wind Speed', '-', `${data.WindSpeed} mph`)
        table.addRow('Wind Gust', '-', `${data.WindGust} mph`)
    }

    const addSolar = () => {
        table.addRow('Solar Radiation', '-', `${data.SolarRadiation} W/m\xB2`)
        table.addRow('UV Index', '-', data.UV)
    }

    const addRain = () => {
        table.addRow('Rain Rate', '-', `${data.RainRate} in`)
        table.addRow('Daily Rain', '-', `${data.DailyRain} in`)
    }

    const addStatus = () => {
        table.addRow('Capacitor Voltage', '-', `${data.CapacitorVoltage} V`)
        table.addRow('Battery Voltage', '-', `${data.BatteryVoltage} V`)
    }

    return new Promise((Resolve, Reject) => {
        switch(options) {
            case 'all':
                addTime()
                addTemperature()
                addHumidity()
                addWind()
                addSolar()
                addRain()
                addStatus()

                Resolve(table)
                break;
            case 'temperature':
                addTemperature()

                Resolve(table)
                break;
            default:
                Reject('Invalid metric - please use "all", "temperature"')
        }
    })
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id

    const sendReport = async (options) => {
        try {
            let table = await generateReport(options)
            bot.sendMessage(chatId, `<pre>${table}</pre>`, {parse_mode: "html"})
        } catch(error) {
            bot.sendMessage(chatId, `${error}`)
        }
    }

    const sendForecast = async () => {
        try {
            bot.sendMessage(chatId, 'Forecast code will eventually go here')
        } catch(error) {
            bot.sendMessage(chatId, `${error}`)
        }
    }

    let command = msg.text.split(" ")

    switch(command[0]) {
        case 'Report':
        case 'report':
            sendReport(command[1])
            break;
        case 'Forecast':
        case 'forecast':
            sendForecast()
            break;
        default:
            bot.sendMessage(chatId, 'Invalid command')
    }

})

module.exports = {
    writeBuffer
}