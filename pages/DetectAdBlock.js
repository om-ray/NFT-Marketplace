import React, { Component } from "react";

class DetectAdBlock extends Component {
  constructor(props) {
    super(props);
    this.state = {
      adBlockDetected: false,
    };
    this.detectAdBlocker = this.detectAdBlocker.bind(this);
  }
  componentDidMount() {
    this.detectAdBlocker();
  }
  componentWillUpdate(nextProps, nextState) {
    if (this.props.pathname !== nextProps.pathname) {
      this.detectAdBlocker();
    }
  }
  detectAdBlocker() {
    const head = document.getElementsByTagName("head")[0];

    const noAdBlockDetected = () => {
      this.setState({
        adBlockDetected: false,
      });
    };
    const adBlockDetected = () => {
      this.setState({
        adBlockDetected: true,
      });
    };
    // clean up stale bait
    const oldScript = document.getElementById("adblock-detection");
    if (oldScript) {
      head.removeChild(oldScript);
    }
    // we will dynamically generate some 'bait'.
    const script = document.createElement("script");
    script.id = "adblock-detection";
    script.type = "text/javascript";
    script.src = "/adframe.js";
    script.onload = noAdBlockDetected;
    script.onerror = adBlockDetected;
    head.appendChild(script);
  }
  noticeContentJSX() {
    return (
      <div id="adblock-notice">
        <div className="message">
          <h3>Hey, you!</h3>
          <p>Your adblocker is on again.</p>
          <button onClick={this.detectAdBlocker}>Check for Adblocker again</button>
        </div>
      </div>
    );
  }
  render() {
    return <div id="adblock-wrapper">{this.state.adBlockDetected ? this.noticeContentJSX() : null}</div>;
  }
}
export default DetectAdBlock;
