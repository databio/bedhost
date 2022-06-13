import React from "react";
import MaterialTable from "material-table";
import { tableIcons } from "./tableIcons";
import Spinner from "react-bootstrap/Spinner";
import { Paper } from "@material-ui/core";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Header from "./header";
import VersionsSpan from "./versionsSpan";
import "./style/home.css";

export default class CreateBedSet extends React.Component {
  constructor() {
    super();
    this.state = {
      myBedSetName: "",
      myBedSet: JSON.parse(localStorage.getItem('myBedSet'))
    };
  }

  async componentDidMount() {
    console.log("my bed set:", this.state.myBedSet)
  }

  createBedSet() {
    localStorage.clear();
    console.log("my bed setname :", this.state.myBedSetName)
  }

  handleChange(e) {
    this.setState({ myBedSetName: e.target.value });

  }

  render() {
    return (
      <React.StrictMode>
        <Header />
        <div
          className="conten-body"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <Container style={{ width: "75%" }} fluid className="p-4">

            <MaterialTable
              title="My BED Set"
              icons={tableIcons}
              columns={[
                { title: 'Name', field: 'name' }
              ]}
              data={this.state.myBedSet}
              editable={{
                onRowDelete: oldData =>
                  new Promise((resolve, reject) => {
                    setTimeout(() => {
                      const dataDelete = [...this.state.myBedSet];
                      const index = oldData.tableData.id;
                      dataDelete.splice(index, 1);
                      this.setState({
                        myBedSet: dataDelete
                      }, () => {
                        localStorage.setItem('myBedSet', JSON.stringify(this.state.myBedSet))
                      });
                      resolve()
                    }, 1000)
                  }),
              }}
              options={{
                headerStyle: {
                  backgroundColor: "#264653",
                  color: "#FFF",
                  fontWeight: "bold",
                },
                actionsColumnIndex: -1,
                actionsCellStyle: { justifyContent: "center" },
                paging: true,
                search: false,
                toolbar: false,
              }}
              components={{
                Container: (props) => <Paper {...props} elevation={0} />,
              }}
            />

            <button
              style={{ height: "33px" }}
              className="float-right btn btn-sm my-btn"
              onClick={this.createBedSet.bind(this)}
            >
              Create My BED Set
            </button>

            <input
              type="text"
              placeholder="My BED set name"
              style={{ height: "33px", fontSize: 12 }}
              className="float-right"
              value={this.state.myBedSetName}
              onChange={this.handleChange.bind(this)}
            />

          </Container>
        </div>
        <VersionsSpan />
      </React.StrictMode>
    );
  }
}
