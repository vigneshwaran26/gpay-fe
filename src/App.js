import nike from "./assests/nike.png";
import "./App.css";

function App() {

  //check user readiness
  const canMakePaymentCache = 'canMakePaymentCache';

  function checkCanMakePayment(request) {
    // Check canMakePayment cache, use cache result directly if it exists.
    if (sessionStorage.hasOwnProperty(canMakePaymentCache)) {
      return Promise.resolve(JSON.parse(sessionStorage[canMakePaymentCache]));
    }

    // If canMakePayment() isn't available, default to assume the method is
    // supported.
    var canMakePaymentPromise = Promise.resolve(true);

    // Feature detect canMakePayment().
    if (request.canMakePayment) {
      canMakePaymentPromise = request.canMakePayment();
    }

    return canMakePaymentPromise
      .then((result) => {
        // Store the result in cache for future usage.
        sessionStorage[canMakePaymentCache] = result;
        return result;
      })
      .catch((err) => {
        console.log('Error calling canMakePayment: ' + err);
      });
  }

  function onBuyClicked() {
    if (!window.PaymentRequest) {
      console.log('Web payments are not supported in this browser.');
      return;
    }

    // Create supported payment method.
    const supportedInstruments = [
      {
        supportedMethods: ['https://tez.google.com/pay'],
        data: {
          pa: 'akshaykashid@ybl', //BCR2DN6TZ76K7GKI
          pn: 'demo',
          tr: '15876ABCD',  // Your custom transaction reference ID
          url: 'https://nifty-nightingale-bdf053.netlify.app',
          mc: '5192', //Your merchant category code
          tn: 'Purchase in Merchant'

        }
      }
    ]

    // Create order detail data.
    const details = {
      total: {
        label: 'Total',
        amount: {
          currency: 'INR',
          value: '1.01', // sample amount
        },
      },
      displayItems: [{
        label: 'Original Amount',
        amount: {
          currency: 'INR',
          value: '1.01',
        },
      }],
    };

    // Create payment request object.
    let request = null;
    try {
      request = new PaymentRequest(supportedInstruments, details);
    } catch (e) {
      console.log('Payment Request Error: ' + e.message);
      return;
    }
    if (!request) {
      console.log('Web payments are not supported in this browser.');
      return;
    }

    var canMakePaymentPromise = checkCanMakePayment(request);
    canMakePaymentPromise
      .then((result) => {
        showPaymentUI(request, result);
      })
      .catch((err) => {
        console.log('Error calling checkCanMakePayment: ' + err);
      });
  }

  //show payment UI
  function showPaymentUI(request, canMakePayment) {
    if (!canMakePayment) {
      handleNotReadyToPay();
      return;
    }

    let paymentTimeout = window.setTimeout(function () {
      window.clearTimeout(paymentTimeout);
      request.abort()
        .then(function () {
          console.log('Payment timed out after 20 minutes.');
        })
        .catch(function () {
          console.log('Unable to abort, user is in the process of paying.');
        });
    }, 20 * 60 * 1000);

    //displays UI for payment
    request.show()
      .then(function (instrument) {
        console.log("instrument:::", instrument)
        window.clearTimeout(paymentTimeout);
        processResponse(instrument); // Handle response from browser.
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function processResponse(instrument) {
    var instrumentString = instrumentToJsonString(instrument);
    console.log(instrumentString);

    fetch('/buy', {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: instrumentString,
    })
      .then(function (buyResult) {
        console.log("buy result::", buyResult)
        if (buyResult.ok) {
          return buyResult.json();
        }
        console.log('Error sending instrument to server.');
      })
      .then(function (buyResultJson) {

        completePayment(instrument, buyResultJson.status, buyResultJson.message);

      })
      .catch(function (err) {
        console.log('Unable to process payment. ' + err);
      });
    // completePayment(instrument, 200, "success");
    // buyResult.json();
    // completePayment(instrument, "success", "payment done");
  }

  //complete payment
  function completePayment(instrument, result, msg) {
    instrument.complete(result)
      .then(function () {
        console.log('Payment succeeds.');
        console.log(msg);
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  function handleNotReadyToPay() {
    alert('Google Pay is not ready to pay.');
  }

  //instrument to json string
  function instrumentToJsonString(instrument) {
    return JSON.stringify(instrument)
  }

  return (
    <div className="App">
      <header className="App-header">
        <div class="card">
          <img src={nike} alt="" className="img-wid"></img>
          <div class="container">
            <p className="card-title">
              Nike Air Max <i>men's</i>
            </p>
            <p className="card-desc">Sustainable Material</p>
            <div>
              <button className="card-btn" onClick={() => onBuyClicked()}>
                Buy now
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
