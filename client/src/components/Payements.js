import React, { Component } from "react";
import StripeChekout from "react-stripe-checkout";
import { connect } from "react-redux";
import * as actions from "./../actions";
class Payments extends Component {
  render() {
    return (
      <StripeChekout
        name="Emaily"
        description="$5 for 5 email credits"
        amount={500}
        token={token => this.props.handleToken(token)}
        stripeKey={process.env.REACT_APP_STRIPE_KEY}
      >
        <button className="btn"> Add credits</button>
      </StripeChekout>
    );
  }
}

export default connect(null, actions)(Payments);
