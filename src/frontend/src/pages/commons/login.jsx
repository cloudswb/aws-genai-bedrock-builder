// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import React, { useState, useCallback } from 'react';

import {
  Button,
  Container,
  Header,
  SpaceBetween,
  ColumnLayout,
  FormField,
  Input,
  Hotspot,
} from '@cloudscape-design/components';

import '../../styles/base.scss';

import { config } from '../../../config';
import { AuthenticationDetails, CognitoUserPool, CognitoUser, CognitoRefreshToken } from 'amazon-cognito-identity-js';
import Cookies from 'js-cookie';
import { result } from 'lodash';


let cognitoUser, sessionUserAttributes;

export const LoginComponent = () => {

  const [displayNewPwdPage, setDisplayNewPwdPage] = useState(false)

  const [username, setUserName] = useState('')
  const [userPassword, setUserPassword] = useState('')

  const [userNewPassword, setUserNewPassword] = useState('')
  const [userNewPasswordRepeat, setUserNewPasswordRepeat] = useState('')


  const onUserNameChange = useCallback(event => setUserName(event.detail.value), []);
  const onUserPasswordChange = useCallback(event => setUserPassword(event.detail.value), []);
  const onUserNewPasswordChange = useCallback(event => setUserNewPassword(event.detail.value), []);
  const onUserNewPasswordRepeatChange = useCallback(event => setUserNewPasswordRepeat(event.detail.value), []);

  const [signState, setSignState] = useState(false)
  const [newPwdState, setNewPwdState] = useState(false)


  const AWS = require('aws-sdk');


  const userPool = new CognitoUserPool(config.POOL_DATA);
  const parseJwt = token => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    return JSON.parse(window.atob(base64));
  };



  const signIn = () => {

    const authenticationDetails = new AuthenticationDetails(
      { Username: username, Password: userPassword }
    );

    cognitoUser = new CognitoUser({ Username: username, Pool: userPool });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        const idToken = result.getIdToken().getJwtToken();
        const accessToken = result.getAccessToken().getJwtToken();

        // console.log('Access Token:', parseJwt(accessToken));
        // console.log('ID Token:', parseJwt(idToken));

        // console.log('accessToken:', accessToken);
        // Save token to a cookie
        Cookies.remove('jwt');
        Cookies.set('jwt', accessToken, { expires: 1 });

        // console.log('Sign In successful:', Cookies.get('jwt'));
        window.location.reload();
        setSignState(false);
      },

      onFailure: (err) => {
        alert(err.message || JSON.stringify(err, null, 2), 'danger');
        setSignState(false);
      },
      newPasswordRequired: function (userAttributes, requiredAttributes) {
        // User was signed up by an admin and must provide new
        // password and required attributes, if any, to complete
        // authentication.

        // userAttributes: object, which is the user's current profile. It will list all attributes that are associated with the user.
        // Required attributes according to schema, which don’t have any values yet, will have blank values.
        // requiredAttributes: list of attributes that must be set by the user along with new password to complete the sign-in.


        // Get these details and call
        // newPassword: password that user has given
        // attributesData: object with key as attribute name and value that the user has given.

        // cognitoUser.completeNewPasswordChallenge(pw, userAttributes, this);

        // the api doesn't accept this field back
        delete userAttributes.email_verified;
        delete userAttributes.email;

        // store userAttributes on global variable
        sessionUserAttributes = userAttributes;

        setDisplayNewPwdPage(true)
      },
      totpRequired: (codeDeliveryDetails) => {
        // console.log('mfaRequired:', codeDeliveryDetails);
        const verificationCode = prompt('Please input second factor code:', '');
        cognitoUser.sendMFACode(verificationCode, this, 'SOFTWARE_TOKEN_MFA');
      },
    });
  }

  const handleNewPassword = (newPassword) => {
    console.log("sessionUserAttributes:", sessionUserAttributes)
    cognitoUser.completeNewPasswordChallenge(newPassword, sessionUserAttributes, {
      onSuccess: (result) => {
        setNewPwdState(false);
        setDisplayNewPwdPage(false)
        setSignState(false)
      },
      onFailure: (err) => {
        alert(err)
      },
    });

  }

  const handleLogin = (props) => {
    // postData();
    signIn();
  };


  return (
    <SpaceBetween>
      <ColumnLayout columns={3}>

        <div></div>

        {!displayNewPwdPage ? (
          <Container header={<Header>Sign In</Header>} >
            <FormField
              label="User Name"
              constraintText="The name can be a username or email"
            >
              <Hotspot hotspotId="transcription-job-name">
                <Input value={username} placeholder="Input the User name" onChange={onUserNameChange} />
              </Hotspot>
            </FormField>
            <br />
            <FormField
              label="User Password"
              constraintText="The password can be up to 20 characters long. Valid characters are a-z, A-Z, 0-9, . (period), _ (underscore) and - (hyphen)."
            >
              <Hotspot hotspotId="transcription-job-name">
                <Input value={userPassword} placeholder="Input the Password " onChange={onUserPasswordChange} type='password' />
              </Hotspot>
            </FormField>
            <br />
            <form onSubmit={event => event.preventDefault()}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => {
                  setUserName('')
                  setUserPassword('')
                  setSignState(false);

                }}>Clean</Button>
                <Button variant="primary" onClick={() => {
                  setSignState(true);
                  handleLogin()
                }} disabled={signState} >Sign In</Button>
              </SpaceBetween>
            </form>

            {/* <Message /> */}
          </Container>

        ) : (
          <Container header={<Header>Set new Password</Header>}>

            <FormField
              label="User new Password"
              constraintText="The password can be up to 20 characters long. Valid characters are a-z, A-Z, 0-9, . (period), _ (underscore) and - (hyphen)."
            >
              <Hotspot hotspotId="transcription-job-name">
                <Input value={userNewPassword} placeholder="Input the Password " onChange={onUserNewPasswordChange} type='password' />
              </Hotspot>
            </FormField>

            <FormField
              label="Repeat your new Password"
              constraintText="The password can be up to 20 characters long. Valid characters are a-z, A-Z, 0-9, . (period), _ (underscore) and - (hyphen)."
            >
              <Hotspot hotspotId="transcription-job-name">
                <Input value={userNewPasswordRepeat} placeholder="Input the Password " onChange={onUserNewPasswordRepeatChange} type='password' />
              </Hotspot>
            </FormField>
            <br />
            <form onSubmit={event => event.preventDefault()}>
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => {
                  setUserNewPassword('')
                  setUserNewPasswordRepeat('')
                  setNewPwdState(false);
                }}>Clean</Button>
                <Button variant="primary" onClick={() => {
                  if(userNewPassword.trim() != userNewPasswordRepeat.trim())
                  {
                    alert('The password inputed are not same.')
                    return
                  }
                  setNewPwdState(true)
                  handleNewPassword(userNewPassword.trim())
                }} disabled={newPwdState} >Update Password</Button>
              </SpaceBetween>
            </form>
          </Container>
        )}
        <div></div>
        {/* <FeaturesSpotlightFooter /> */}
      </ColumnLayout>
    </SpaceBetween>
  )


};
