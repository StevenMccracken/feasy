//
//  LoginViewController.swift
//  Feasy
//
//  Created by Steven McCracken on 10/14/17.
//  Copyright © 2017 Feasy. All rights reserved.
//

import UIKit



class LoginViewController: UIViewController {

  @IBOutlet weak var usernameField: UITextField!
  @IBOutlet weak var passwordField: UITextField!
  @IBOutlet weak var loginButton: UIButton!
  
  private let usernameFieldTag = 0
  private let passwordFieldTag = 1
  
  override func viewDidLoad() {
    super.viewDidLoad()

    // Do any additional setup after loading the view.
    usernameField.delegate = self
    passwordField.delegate = self
    
    usernameField.tag = usernameFieldTag
    passwordField.tag = passwordFieldTag
    
    loginButton.layer.cornerRadius = 9
}

  override func didReceiveMemoryWarning() {
    super.didReceiveMemoryWarning()
    // Dispose of any resources that can be recreated.
  }
    
  @IBAction func loginButtonPressed(_ sender: UIButton?) {
    updateLoginButton(withEnabledStatus: false)
    usernameField.resignFirstResponder()
    passwordField.resignFirstResponder()
    
    UserService.login(resolve: { [weak self] (response: HTTPURLResponse, body: [String: Any]) in
      guard let strongSelf = self else { return }
      if response.statusCode == 200  {
        if let success = body["success"] as? [String: Any], let jwt = success["token"] as? String {
          LoginManager.setToken(token: jwt)
          LoginManager.validLogin()
          
          strongSelf.dismiss(animated: true)
        } else {
          // Token isn't in response body
          strongSelf.updateLoginButton(withEnabledStatus: true)
        }
      } else {
        // Login credentials are invalid
        strongSelf.updateLoginButton(withEnabledStatus: true)
      }
    })
  }
  
  func updateLoginButton(withEnabledStatus enabled: Bool) {
    let color: UIColor = enabled ? .salmon : .lightGray
    DispatchQueue.main.async {
      self.loginButton.isEnabled = enabled
      self.loginButton.backgroundColor = color
    }
  }
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    // Check if the user tapped anywhere outside the text fields. If so, dismiss the keyboard
    if let touch: UITouch = touches.first, let view = touch.view {
      if !view.isKind(of: UITextField.self) {
        view.endEditing(true)
      }
    }
  }
}

extension LoginViewController: UITextFieldDelegate {
  
  func textFieldShouldReturn(_ textField: UITextField) -> Bool {
    // Try to find next responder
    if let nextField = textField.superview?.viewWithTag(textField.tag + 1) as? UITextField {
      nextField.becomeFirstResponder()
    } else {
      // Not found, so remove keyboard.
      textField.resignFirstResponder()
      if usernameField.text != "" && passwordField.text != "" {
        loginButtonPressed(nil)
      }
    }
    
    // Do not add a line break
    return false
  }

  func textField(_ textField: UITextField, shouldChangeCharactersIn range: NSRange, replacementString string: String) -> Bool {
    updateLoginButton(withEnabledStatus: usernameField.text != "" && passwordField.text != "")
    return true
  }
}
