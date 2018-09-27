import React from 'react';
import {connect} from 'react-redux';
import s from "./Image.css";

class Image extends React.Component {

  imageRef = React.createRef();
  rootRef = React.createRef();

  state = {
    width: 0,
    height: 0
  };

  onImageLoad = () => {
    const img = this.imageRef.current;
    const div = this.rootRef.current;
    if (!img || !div) {
      return;
    }
    const width = div.clientWidth;
    const height = width * img.naturalHeight / img.naturalWidth;
    this.setState({
      width,
      height
    });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.image !== this.props.image && this.imageRef.current) {
      if (!this.props.image) {
        this.imageRef.current.src = '';
      } else {
        this.imageRef.current.src = this.props.image;
      }
    }
  }

  render() {
    const {width, height} = this.state;
    const {lastImage} = this.props;
    return <div className={s.root} style={{height}} ref={this.rootRef}>
      <div className={s.stats}>Last image: {lastImage}</div>
      <img ref={this.imageRef} width={width} height={height} onLoad={this.onImageLoad} style={{height}}/>
    </div>;
  }
}

const mapStateToProps = state => ({
  image: state.device.get('image'),
  lastImage: state.device.get('lastImage')
});

export default connect(mapStateToProps)(Image);
