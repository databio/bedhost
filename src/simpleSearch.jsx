import React from 'react';
import "./style/queryBuilder.css";
import ResultsBed from './queryResultsBed'
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown'
import axios from "axios";
import bedhost_api_url from "./const";

const api = axios.create({
    baseURL: bedhost_api_url,
});


export default class SimpleSearch extends React.Component {
    constructor(props) {
        super();
        this.state = {
            showResults: false,
            searchTerm: "",
            genomeList: [],
            genome: ""
        };
    }

    async componentDidMount() {
        let genomes = await api.get("/api/bed/genomes").then(({ data }) => data)
        this.setState({ genomeList: genomes[0] });
        console.log("test", this.state.genomeList)

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

    handleSelect(e) {
        this.setState({
            genome: e
        });
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
            <div >
                <Container >
                    <Row style={{ marginBottom: "15px"}}>
                        <input className='float-left'
                            style={{ marginRight: '15px', width: '80%', height: '35px', padding: '5px', borderColor: '#ced4da', borderStyle: 'solid', borderWidth: '1px', borderRadius: '.25rem' }}
                            type="text"
                            value={this.searchTerm}
                            onChange={this.setSearchTerm.bind(this)}
                        />
                        <DropdownButton
                            alignRight
                            title={this.state.genome ? (this.state.genome) : "Select Genome"}
                            id="select-genome"
                            onSelect={this.handleSelect.bind(this)}
                            style={{ marginRight: '2px'}}
                        >
                            {this.state.genomeList.map((value, index) => {
                                return (
                                    <Dropdown.Item eventKey={value.alias}>{value.alias}</Dropdown.Item>
                                )
                            })}
                        </DropdownButton>
                        <button className='float-right btn btn-sm my-btn' onClick={this.setShowResults.bind(this)}>SEARCH</button>

                    </Row>
                    {this.state.showResults ? (
                        <ResultsBed term={this.state.searchTerm} genome={this.state.genome}/>
                    ) : null
                    }
                </Container>
            </div>
        );
    }
};