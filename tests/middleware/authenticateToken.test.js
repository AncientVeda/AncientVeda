const jwt = require('jsonwebtoken');
const authenticateToken = require('../../middleware/authenticateToken');

describe('authenticateToken Middleware', () => {
  it('sollte 401 zurückgeben, wenn kein Token vorhanden ist', () => {
    const req = { get: jest.fn().mockReturnValue(null) }; // Kein Authorization-Header
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Kein Token vorhanden.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sollte 403 zurückgeben, wenn der Token ungültig ist', () => {
    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Ungültiger Token');
    });

    const req = { get: jest.fn().mockReturnValue('Bearer invalidtoken') };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ungültiger Token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('sollte next() aufrufen, wenn der Token gültig ist', () => {
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: '123', role: 'admin' });

    const req = { get: jest.fn().mockReturnValue('Bearer validtoken') };
    const res = {};
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(req.user).toEqual({ userId: '123', role: 'admin' });
    expect(next).toHaveBeenCalled();
  });
});

