// import React from 'react';
// import "react-responsive-carousel/lib/styles/carousel.min.css";
// import { Carousel } from 'react-responsive-carousel';
// import Container from "react-bootstrap/Container";
// import Modal from 'react-bootstrap/Modal'
// import ModalImage from "./modalImage";

// export default class CarouselGallery extends React.Component {
//   constructor(props) {
//     super();
//     this.state = {
//       showModal: false,
//       showFig: false
//     };
//   }

//   handleClose() {
//     this.setState({ showModal: false })
//   }
//   handleShow(index) {
//     this.setState({ showModal: true, showFig: this.props.imgList[index] })
//   }

//   render() {
//     return (
//       <Container >
//         <Carousel onClickItem={(index, item) => {
//           this.handleShow(index);
//         }} >
//           {this.props.imgList.map((image, index) => {
//             return (
//               <div key={index}>
//                 {/* <ModalImage image={image} /> */}
//                 <img
//                   src={image.src_png}
//                   alt={image.name} />
//                 <p style={{ background: "white" }}> <b>Fig. {index + 1} :</b> {image.caption}</p>
//               </div>

//             );
//           })}
//         </Carousel>
//         <Modal
//           centered
//           dialogClassName="custom-modal"
//           show={this.state.showModal}
//           onHide={() => this.handleClose()}
//         >
//           <Modal.Header closeButton>
//             <Modal.Title>{this.state.showFig.caption}</Modal.Title>
//           </Modal.Header>
//           <Modal.Body><iframe title="pdf" style={{ margin: 'auto', display:'block', height: 650, width: 600 }} src={this.state.showFig.src_pdf}></iframe></Modal.Body>
//           <Modal.Footer>
//             <button className='btn btn-sm my-btn' onClick={() => this.handleClose()}>
//               Close
//           </button>
//           </Modal.Footer>
//         </Modal>
//       </Container>
//     );
//   }
// }