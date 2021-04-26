import React from 'react';
import "./style/queryBuilder.css";
import ResultsBed from './queryResultsBed'
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";


export default class SimpleSearch extends React.Component {
    constructor(props) {
        super();
        this.state = {
            showResults: false,
            searchTerm: "",
        };
    }

    setShowResults() {
        this.setState({ showResults: true });
        console.log(this.state.searchTerm, this.state.showResults)
    }

    setSearchTerm(event) {
        this.setState({
            showResults: false,
            searchTerm: event.target.value
        });
        console.log(this.state.searchTerm, this.state.showResults)
        this.forceUpdate();
    }

    // setLimit(event) {
    //     if (this.state.table_name === 'bedfiles') {
    //         this.setState({ bedlimit: event.target.value });
    //     } else {
    //         this.setState({ setlimit: event.target.value });
    //     }

    // };

    render() {
        return (
            <div>
                <Container>
                    <Row style={{ marginBottom: "15px"}}>
                        <input className='float-left'
                            style={{  marginRight: '15px', width: '90%', height: '27px', padding: '5px', borderColor: '#ced4da', borderStyle: 'solid', borderWidth: '1px', borderRadius: '.25rem' }}
                            type="text"
                            value={this.searchTerm}
                            onChange={this.setSearchTerm.bind(this)}
                        />
                        <button className='float-right btn btn-sm my-btn' onClick={this.setShowResults.bind(this)}>SEARCH</button>
                        
                    </Row>
                    {this.state.showResults ? (
                        <ResultsBed term={this.state.searchTerm} />
                    ) : null
                    }
                </Container>
            </div>
        );
    }
};