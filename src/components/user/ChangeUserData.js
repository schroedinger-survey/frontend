import React, {useEffect, useState} from "react";
import {Container, Form} from "react-bootstrap";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import SideMenu from "../menu/side-menu/SideMenu";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import axios from "axios";
import storageManager from "../../storage/LocalStorageManager";
import Message from "../utils/Message";
import Modal from "react-bootstrap/Modal";
import {confirmDoubleInput} from "../utils/ConfirmInput";

const ChangeUserData = (props) => {
    const {history} = props;

    const [showModal, setShowModal] = useState(false);

    const [userData, setUserData] = useState({});
    const [newUserData, setNewUserData] = useState({
        username: "",
        email: "",
        confirmationEmail: "",
        password: "",
        confirmationPassword: "",
        oldPassword: "",
        confirmDeleteUsername: "",
        confirmDeletePassword: ""
    })
    const {username, email, confirmationEmail, password, confirmationPassword, oldPassword, confirmDeleteUsername, confirmDeletePassword} = newUserData;

    /**
     * Used as props for the child Component Message
     * showMessage: state of visibility of component Message
     * messageText: string containing the message to be displayed
     * messageType: "danger" || "success" - based off of bootstrap colors
     */
    const [showMessage, setShowMessage] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [messageType, setMessageType] = useState("");

    const [showMessageDelete, setShowMessageDelete] = useState(false);
    const [messageTextDelete, setMessageTextDelete] = useState("");
    const [messageTypeDelete, setMessageTypeDelete] = useState("");

    const advancedUserInformation = async() => {
        const userInfoResponse = await axios({
            method: "POST",
            url: "/api/v1/user/info",
            headers: {
                "Authorization": storageManager.getJWTToken()
            }
        });
        if (userInfoResponse.status === 200){
            setUserData(userInfoResponse.data);
        }
    }

    const handleUserInput = (name) => (event) => {
        setShowMessage(false);
        setShowMessageDelete(false);
        setNewUserData({...newUserData, [name]: event.target.value})
    }

    const validateInput = () => {
        if(email === "" && username === "" && password === ""){
            return {valid: false, message: "Nothing changed!", type: "warning"}
        }else if(email !== confirmationEmail){
            return {valid: false, message: "Make sure your your Emails match!", type: "danger"}
        } else if (password !== confirmationPassword){
            return {valid: false, message: "Make sure your your Passwords match!", type: "danger"}
        } else if (oldPassword !== "" && password !== "" && confirmationPassword !== "" && oldPassword === password ){
            return {valid: false, message: "New Password was already used, please choose a new one.", type: "danger"}
        } else if( oldPassword === ""){
            return {valid: false, message: "Please supply your old password!", type: "danger"}
        }
        return {valid: true, message: "Input valid", type: "success"}
    }

    const sendNewUserData = async() => {
        const validInput = validateInput();
        if (validInput.valid){
            let sendChangedData;
            if(password === ""){
               sendChangedData = await axios({
                   method: "PUT",
                   url: "/api/v1/user",
                   headers: {
                       "Authorization": storageManager.getJWTToken()
                   },
                   data: {
                       username: username !== "" ? username : null,
                       email: email !== "" ? email : null,
                       old_password: oldPassword
                   }
               })
            } else {
               sendChangedData = await axios({
                    method: "PUT",
                    url: "/api/v1/user",
                    headers: {
                        "Authorization": storageManager.getJWTToken()
                    },
                    data: {
                        username: username !== "" ? username : null,
                        email: email !== "" ? email : null,
                        old_password: oldPassword,
                        new_password: password
                    }
                })
                if(sendChangedData.status === 204){
                    storageManager.clearToken();
                    history.push("/");
                }
            }
            if (sendChangedData.status === 204){
                setShowMessage(true);
                setMessageType("success");
                setMessageText("Changed your user data")
            }
        } else {
            setShowMessage(true);
            setMessageType(validInput.type);
            setMessageText(validInput.message)
        }
    }

    const deleteUserModal = () => {
        return (
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Deleting your user account</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    To confirm that you want to delete your user account, please provide your <span style={{fontWeight: "bold"}}>username</span> and <span style={{fontWeight: "bold"}}>password</span>.
                    <hr/>
                    <Form.Group controlId="username">
                        <Form.Label>Username*</Form.Label>
                        <Form.Control type="username" placeholder="Enter username" value={confirmDeleteUsername} onChange={handleUserInput("confirmDeleteUsername")}/>
                    </Form.Group>
                    <Form.Group controlId="username">
                        <Form.Label>Current Password*</Form.Label>
                        <Form.Control type="password" placeholder="Enter password" value={confirmDeletePassword} onChange={handleUserInput("confirmDeletePassword")}/>
                    </Form.Group>
                    {showMessageDelete && <Message type={messageTypeDelete} message={messageTextDelete}/>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Rather not
                    </Button>
                    <Button variant="danger" onClick={deleteUser}>
                        Yes, delete my account
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }

    const deleteUser = async() => {
        if (confirmDeleteUsername === userData.username){
            try{
                const deleteAccount = await axios({
                    method: "DELETE",
                    url: "/api/v1/user",
                    headers: {
                        "Authorization": storageManager.getJWTToken()
                    },
                    data: {
                        password: confirmDeletePassword
                    }
                });
                if (deleteAccount.status === 200){
                    storageManager.clearToken();
                    history.push("/");
                } else {
                    setShowMessageDelete(true);
                    setMessageTypeDelete("danger");
                    setMessageTextDelete("That did not work");
                }
            } catch (e){
                console.log("User could not be deleted",e);
                setShowMessageDelete(true);
                setMessageTypeDelete("danger");
                setMessageTextDelete("Please check the given credentials again.");
            }

        } else {
            setShowMessageDelete(true);
            setMessageTypeDelete("danger");
            setMessageTextDelete("Username is wrong. Please try again!");
        }
    }

    useEffect(() => {
       advancedUserInformation()
    }, [])

    return(
        <Container fluid>
            <Row>
                <Col xs={1} style={{padding: 0}}>
                    <SideMenu/>
                </Col>
                <Col xs={{span: 5, offset: 3}} style={{marginTop: "10px"}}>
                    {deleteUserModal()}
                    <Row>
                        <div style={{width: "95%", margin: "0 auto"}}>
                            <label style={{fontWeight: "bold", fontSize: "21px"}}>Current Profile</label>
                            <ListGroup>
                                <ListGroup.Item>Username: <span style={{fontWeight: "bold"}}>{userData.username}</span></ListGroup.Item>
                                <ListGroup.Item>Email: <span style={{fontWeight: "bold"}}>{userData.email}</span></ListGroup.Item>
                                <ListGroup.Item>Account created at: <span style={{fontWeight: "bold"}}>{userData.created ? userData.created.substr(0, 10) : ""}</span></ListGroup.Item>
                            </ListGroup>
                        </div>
                    </Row>
                    <hr style={{backgroundColor: "#065535"}}/>
                    <Row>
                        <Form style={{width: "95%", margin: "0 auto"}}>
                            <label style={{fontWeight: "bold", fontSize: "21px"}}>Change User Data</label>
                            <Form.Group controlId="newUsername">
                                <Form.Label style={{fontWeight: "bold"}}>Username</Form.Label>
                                <Form.Control type="text" placeholder={userData.username} value={username} onChange={handleUserInput("username")}/>
                            </Form.Group>

                            <Form.Group >
                                <Form.Label style={{fontWeight: "bold"}}>Email address</Form.Label>
                                <Form.Control id="newEmail" type="email" placeholder={userData.email} style={confirmDoubleInput("newEmail", "newEmailConfirm")} value={email} onChange={handleUserInput("email")}/>
                            </Form.Group>
                            <Form.Group >
                                <Form.Label>Confirm Email address</Form.Label>
                                <Form.Control type="email" placeholder={userData.email} id="newEmailConfirm" style={confirmDoubleInput("newEmail", "newEmailConfirm")} value={confirmationEmail} onChange={handleUserInput("confirmationEmail")}/>
                                <Form.Text className="text-muted">
                                    Make sure your email is right and you can login.
                                </Form.Text>
                            </Form.Group>

                            <Form.Group>
                                <Form.Label style={{fontWeight: "bold"}}>Password</Form.Label>
                                <Form.Control id={"newPassword"} type="password" placeholder="Password" style={confirmDoubleInput("newPassword", "newPasswordConfirm")} value={password} onChange={handleUserInput("password")}/>
                            </Form.Group>
                            <Form.Group >
                                <Form.Label>Confirm Password</Form.Label>
                                <Form.Control id={"newPasswordConfirm"} type="password" placeholder="Password" style={confirmDoubleInput("newPassword", "newPasswordConfirm")} value={confirmationPassword} onChange={handleUserInput("confirmationPassword")}/>
                            </Form.Group>
                            <Form.Group >
                                <Form.Label style={{fontWeight: "bold"}}>Current Password*</Form.Label>
                                <Form.Control id={"newPasswordConfirm"} type="password" placeholder="Password" value={oldPassword} onChange={handleUserInput("oldPassword")}/>
                            </Form.Group>
                            {showMessage && (
                                <Message type={messageType} message={messageText}/>
                            )}
                            <Button variant="success" onClick={sendNewUserData}>
                                Submit Changes
                            </Button>
                        </Form>
                    </Row>
                    <hr style={{backgroundColor: "lightgrey"}}/>
                    <Row>
                        <div style={{width: "95%", margin: "0 auto"}}>
                        <Button variant={"outline-danger"} onClick={() => setShowModal(true)}>Delete User account</Button>
                        </div>
                    </Row>
                </Col>
            </Row>
        </Container>
    )
}

export default ChangeUserData;