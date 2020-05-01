const {convertHtmlToPng} = require('../print-utils/print-utils');
const vueSsrRenderer = require('../print-utils/vue-ssr-renderer');
const dayjs = require('dayjs');
const Vue = require('vue');

async function makePrintData(cms, {from, to}) {
  const report = await new Promise((resolve, reject) => {
    cms.api.processData('OrderXReport', {from, to}, result => {
      if (typeof result === 'string') reject(result);
      else resolve(result);
    });
  });

  const reportDate = dayjs(from);
  const xReport = {
    ...report.report,
    ...report.dayReport[reportDate.format('DD-MM-YYYY')]
  };

  const posSettings = await cms.getModel('PosSetting').findOne();
  const companyInfo = posSettings && posSettings.companyInfo;
  return {
    ...companyInfo,
    ...xReport,
    date: reportDate.format('DD/MM/YYYY')
  };
}

async function printEscPos(escPrinter, printData) {
  const {
    name, address, telephone, taxNumber, date, from, to, sum, net, tax, discount, sumByPayment,
    sum0, net0, tax0, sum7, net7, tax7, sum19, net19, tax19
  } = printData;

  function getDateTimeString(date) {
    return dayjs(date).format('DD.MM HH:mm')
  }

  function convertMoney(value) {
    return !isNaN(value) ? value.toFixed(2) : value
  }

  escPrinter.alignCenter();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.println(name);

  escPrinter.bold(false);
  escPrinter.setTextNormal();
  escPrinter.println(address);
  escPrinter.println(`Tel: ${telephone}`);
  escPrinter.println(`VAT Reg No: ${taxNumber}`);

  escPrinter.newLine();
  escPrinter.setTextDoubleHeight();
  escPrinter.bold(true);
  escPrinter.println('X-Report');

  escPrinter.newLine();
  escPrinter.setTextNormal();
  escPrinter.alignLeft();
  escPrinter.bold(true);
  escPrinter.println(`Report Date: ${date}`);
  escPrinter.bold(false);
  escPrinter.println(`First Order: ${getDateTimeString(from)}`);
  escPrinter.println(`Last Order: ${getDateTimeString(to)}`);
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.println('Sales');
  escPrinter.bold(false);
  escPrinter.leftRight('Total', convertMoney(sum));
  escPrinter.leftRight('Sub-total', convertMoney(net));
  escPrinter.leftRight('Tax', convertMoney(tax));
  escPrinter.bold(true);
  escPrinter.drawLine();

  escPrinter.bold(false);

  if (sum0) {
    escPrinter.println('Tax 0%:');
    escPrinter.leftRight('Total', convertMoney(sum0));
    escPrinter.leftRight('Sub-total', convertMoney(net0));
    escPrinter.leftRight('Total', convertMoney(tax0));
    escPrinter.newLine();
  }

  if (sum7) {
    escPrinter.println('Tax 7%:');
    escPrinter.leftRight('Total', convertMoney(sum7));
    escPrinter.leftRight('Sub-total', convertMoney(net7));
    escPrinter.leftRight('Total', convertMoney(tax7));
    escPrinter.newLine();
  }

  if (sum19) {
    escPrinter.println('Tax 19%:');
    escPrinter.leftRight('Total', convertMoney(sum19));
    escPrinter.leftRight('Sub-total', convertMoney(net19));
    escPrinter.leftRight('Total', convertMoney(tax19));
    escPrinter.newLine();
  }

  escPrinter.leftRight('Discount', convertMoney(discount));
  escPrinter.bold(true);
  escPrinter.drawLine();

  Object.keys(sumByPayment).forEach(paymentType => {
    const paymentAmount = sumByPayment[paymentType];
    escPrinter.println(`${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)}: ${convertMoney(paymentAmount)}`);
  });

  await escPrinter.print();
}

async function printSsr(printer, printData) {
  const XReport = require('../../dist/XReport.vue');

  const printComponent = new Vue({
    components: {XReport},
    render(h) {
      return h('XReport', {props: printData})
    }
  });

  vueSsrRenderer.renderToString(printComponent, {}, async (err, html) => {
    if (err) throw err;

    const reportImage = await convertHtmlToPng(html);
    printer.printPng(reportImage);
    await printer.print();
  });
}

module.exports = {
  makePrintData,
  printSsr,
  printEscPos,
}