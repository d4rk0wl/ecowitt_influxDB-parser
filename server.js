//Import all required packages
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

//Setting to ignore self-signed CA on InfluxDB Server - Maybe dangerous
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const app = express()
const port = 3000

//EcoWitt protocol uses URLEncoded form data
app.use(bodyParser.urlencoded({ extended: true }))

app.post('/report', (req, res) => {
    //InfluxDB Environment Variables
    const url = process.env.INFLUX_HOST
    const token = process.env.INFLUX_TOKEN
    const org = process.env.INFLUX_ORG
    const bucket = process.env.INFLUX_BUCKET

    //Destructure POST request
    const { tempinf, humidityin, tempf, humidity, winddir, windspeedmph, windgustmph, solarradiation, uv, rrain_piezo, drain_piezo, ws90cap_volt, wh90batt, temp1f, humidity1, temp2f, humidity2, temp3f, humidity3 } = req.body

    //Create InfluxDB points and assign array
    const pointsArray = [
        new Point('Temperature').tag('location','Living Room').tag('sensor','GW1100').floatField('value', tempinf),
        new Point('Humidity').tag('location','Living Room').tag('sensor','GW1100').floatField('value', humidityin),
        new Point('Temperature').tag('location','Kitchen').tag('sensor','WN31').floatField('value', temp1f),
        new Point('Humidity').tag('location','Kitchen').tag('sensor','WN31').floatField('value', humidity1),
        new Point('Temperature').tag('location','Office').tag('sensor','WN31').floatField('value', temp2f),
        new Point('Humidity').tag('location','Office').tag('sensor','WN31').floatField('value', humidity2),
        new Point('Temperature').tag('location','Bedroom').tag('sensor','WN31').floatField('value', temp3f),
        new Point('Humidity').tag('location','Bedroom').tag('sensor','WN31').floatField('value', humidity3),
        new Point('Temperature').tag('location','Outdoors').tag('sensor','WS90').floatField('value', tempf),
        new Point('Humidity').tag('location','Outdoors').tag('sensor','WS90').floatField('value', humidity),
        new Point('Wind Direction').tag('sensor','WS90').floatField('value', winddir),
        new Point('Wind Speed').tag('sensor','WS90').floatField('value', windspeedmph),
        new Point('Wind Gust').tag('sensor','WS90').floatField('value', windgustmph),
        new Point('Solar Radiation').tag('sensor','WS90').floatField('value', solarradiation),
        new Point('UV').tag('sensor','WS90').floatField('value', uv),
        new Point('Rain Rate').tag('sensor','WS90').floatField('value', rrain_piezo),
        new Point('Daily Rain').tag('sensor','WS90').floatField('value', drain_piezo),
        new Point('Capacitor Voltage').tag('sensor','WS90').floatField('value', ws90cap_volt),
        new Point('Battery Voltage').tag('sensor','WS90').floatField('value', wh90batt)
    ]

    const writePoints = async () => {
        try {
            //Create InfluxDB connection
            const writeApi = new InfluxDB({ url, token }).getWriteApi(org, bucket, 's')

            //Write data and close connection
            await writeApi.writePoints(pointsArray)
            await writeApi.close()
            return
        } catch(err) {
            throw new Error(err)
        }
    }

    //Write points to DB, or log if error encountered
    writePoints()
    .then(() => res.send('OK'))
    .catch((err) => {
        fs.appendFileSync(__dirname + '/Logs/Err_Log.txt', `\n${new Date().toString()} - ${err}`)
        res.status(500).send(`${err}`)
    })

});

app.listen(port, () => {
    console.log('App Running')
});