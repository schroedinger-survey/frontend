import React, {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import storageManager from "../../storage/StorageManager";
import NavDropdown from "react-bootstrap/NavDropdown";

import catIcon from "./icons/cat.png";
import UserAPIHandler from "../../calls/user";

/**
 * The Navbar that will be displayed at every page
 * offers different navigational menu depending on state of user - logged in - logged out
 * @returns {JSX.Element} Navbar
 * @constructor
 */
const NavbarMenu = () => {
    const location = useLocation(); // Current url path, e.g. "/login"

    const [username, setUsername] = useState("");

    const getUserName = async () => {
        if(storageManager.getJWTToken() !== ""){
            const apiResponse = await UserAPIHandler.cacheMiddleware(UserAPIHandler.getUserInfo, "userData");
            setUsername(apiResponse.username);
        }
    }

    useEffect(() => {
        getUserName()
    }, [location.pathname])

    /**
     * Used to change the styling of the nav-links
     * if nav-link belongs to currently active path it is styled different than the others
     * changes when page is changed - click on nav-link
     * @param path is url path name from this nav-link - href
     * @returns {{color: string}|{color: string, fontWeight: string}}
     */
    const activePage = (path) => {
        if (location.pathname === path) { //Active Page
            return {color: "#f5c050", fontWeight: "bolder"};
        } else { // Inactive Page
            return {color: "grey"};
        }
    }

    /**
     * Calls the storageManager method clearToken()
     * which removes the jwt token from session and local storage
     * triggered by click on nav-link Logout
     */
    const logoutUser = async () => {
        storageManager.clearToken();
        await UserAPIHandler.userLogout();
    }

    /**
     * Returns the version of the Nav meant for logged OUT users
     * @returns {JSX.Element} Nav with Nav.Links to home, Register, Login and search Component
     */
    const loggedOut = () => {
        return (
            <Nav className="mr-auto">
                <Nav.Link href="/" style={activePage("/")}>Home</Nav.Link>
                <Nav.Link href="/register" style={activePage("/register")}>Register</Nav.Link>
                <Nav.Link href="/login" style={activePage("/login")}>Login</Nav.Link>
                <Nav.Link href="/password/forgot" style={activePage("/password/forgot")}>Forgot Password</Nav.Link>
                <Nav.Link href="/survey/search" style={activePage("/survey/search")}>Search</Nav.Link>
            </Nav>
        )
    }

    /**
     * Returns the version of the Nav meant for logged IN users
     * @returns {JSX.Element} Nav with Nav.Links to dashboard, CreateSurvey, SubmitSurvey, search and home Component
     */
    const loggedIn = () => {
        return (
            <Nav className="ml-auto">
                <Navbar.Brand href="/" style={{marginRight: "0"}}><img src={catIcon}
                                                                       style={{height: "40px"}}/></Navbar.Brand>
                <NavDropdown title="Menu" id="nav-dropdown" alignRight style={{lineHeight: "40px"}}>
                    <NavDropdown.Item id={1} title={username}
                                      style={{fontWeight: "Bolder", lineHeight: "25px"}}>{username}</NavDropdown.Item>
                    <NavDropdown.Divider/>
                    <Nav.Link href="/settings" style={{paddingLeft: "25px", lineHeight: "25px"}}>Account
                        Settings</Nav.Link>
                    <Nav.Link href="/dashboard" style={{paddingLeft: "25px", lineHeight: "25px"}}>Terms of
                        Service</Nav.Link>
                    <Nav.Link href="/dashboard" style={{paddingLeft: "25px", lineHeight: "25px"}}>Info</Nav.Link>
                    <NavDropdown.Divider/>
                    <Nav.Link href="/" onClick={logoutUser}
                              style={{paddingLeft: "25px", lineHeight: "25px", color: "darkred"}}>Logout</Nav.Link>
                </NavDropdown>
            </Nav>
        )
    }

    return (
        <Navbar style={{boxShadow: "0 2px 4px -1px rgba(0,0,0,0.25)"}}>
            <Navbar.Brand href="/" style={{color: "#065535", fontWeight: "bolder"}}>Schrödinger-Survey</Navbar.Brand>
            {(location.pathname.split("/")[1] !== "s" && location.pathname.split("/")[1] !== "pub") && (
                storageManager.searchForJWTToken() && (
                    loggedIn()
                )
            )}
            {(location.pathname.split("/")[1] !== "s" && location.pathname.split("/")[1] !== "pub") && (
                !storageManager.searchForJWTToken() && (
                    loggedOut()
                )
            )}
        </Navbar>
    )
}

export default NavbarMenu;