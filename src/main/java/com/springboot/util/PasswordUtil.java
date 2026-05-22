package com.springboot.util;

import java.io.Serializable;
import java.io.UnsupportedEncodingException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

import javax.xml.bind.DatatypeConverter;

public class PasswordUtil implements Serializable {
    private static final long serialVersionUID = 1L;
    private final int DEFAULT_SIZE = 32;
    private static PasswordUtil instance;

    public static PasswordUtil getInstance() {
        if (instance != null)
            return instance;

        return new PasswordUtil();
    }

    public String createSalt() throws NoSuchAlgorithmException {
        return DatatypeConverter.printBase64Binary(getSalt(32));
    }

    private byte[] getSalt(int size) throws NoSuchAlgorithmException {
        SecureRandom sr = SecureRandom.getInstance("SHA1PRNG");
        final byte[] salt;
        if (size < 32) {
            salt = new byte[DEFAULT_SIZE];
        } else {
            salt = new byte[size];
        }
        sr.nextBytes(salt);
        return salt;
    }

    public String createPassword(String password)
            throws NoSuchAlgorithmException, UnsupportedEncodingException {
        return sha256(password.concat(createSalt()));
    }

    public String createPassword(String password, String salt)
            throws NoSuchAlgorithmException, UnsupportedEncodingException {
        return sha256(password.concat(new String(salt)));
    }

    public String sha256(String base)
            throws NoSuchAlgorithmException, UnsupportedEncodingException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(base.getBytes("UTF-8"));
        StringBuffer hexString = new StringBuffer();

        for (int i = 0; i < hash.length; i++) {
            String hex = Integer.toHexString(0xff & hash[i]);
            if (hex.length() == 1)
                hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

}

